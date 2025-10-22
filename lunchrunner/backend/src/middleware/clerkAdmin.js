import { createRemoteJWKSet, jwtVerify } from "jose";

function parseAuthorizationHeader(header) {
  if (!header || typeof header !== "string") {
    return null;
  }
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = header.slice("bearer ".length).trim();
  return token || null;
}

function normalizeArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

function hasAdminFlag(metadata, adminRole) {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }
  if (metadata.isAdmin === true) {
    return true;
  }
  const roles = normalizeArray(metadata.roles);
  if (roles.some((role) => role === adminRole)) {
    return true;
  }
  if (metadata.role && metadata.role === adminRole) {
    return true;
  }
  return false;
}

async function fetchClerkUser(userId, config) {
  const apiBase = config.clerkApiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${apiBase}/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${config.clerkSecretKey}`,
    },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const error = new Error("Failed to fetch Clerk user profile");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function createRequireClerkAdmin(config) {
  const issuerUrl = new URL(config.clerkIssuerUrl);
  const jwksUrl = new URL(".well-known/jwks.json", issuerUrl);
  const jwks = createRemoteJWKSet(jwksUrl);

  return async function requireClerkAdmin(req, res, next) {
    try {
      const token = parseAuthorizationHeader(req.headers.authorization);
      if (!token) {
        res.status(401).json({ message: "Authorization header with Bearer token is required" });
        return;
      }

      const verificationOptions = {
        issuer: config.clerkIssuerUrl,
      };
      if (config.clerkJwtAudience) {
        verificationOptions.audience = config.clerkJwtAudience
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
      }

      const { payload } = await jwtVerify(token, jwks, verificationOptions);

      if (!payload.sub) {
        res.status(401).json({ message: "Token is missing user information" });
        return;
      }

      req.auth = {
        ...(req.auth ?? {}),
        token,
        userId: payload.sub,
        sessionId: payload.sid,
        email: payload.email ?? payload.email_address ?? null,
        claims: payload,
      };

      const adminRole = config.clerkAdminRole;
      const metadataCandidates = [
        payload.public_metadata,
        payload.private_metadata,
        payload.unsafe_metadata,
      ];
      let isAdmin = metadataCandidates.some((metadata) => hasAdminFlag(metadata, adminRole));

      if (!isAdmin && payload.org_role && payload.org_role === adminRole) {
        isAdmin = true;
      }

      if (!isAdmin) {
        try {
          const userProfile = await fetchClerkUser(payload.sub, config);
          if (userProfile) {
            const userMetadata = [
              userProfile.public_metadata,
              userProfile.private_metadata,
            ];
            isAdmin = userMetadata.some((metadata) => hasAdminFlag(metadata, adminRole));
          }
        } catch (error) {
          next(error);
          return;
        }
      }

      if (!isAdmin) {
        res.status(403).json({ message: "Administrator permissions required" });
        return;
      }

      next();
    } catch (error) {
      const invalidCodes = new Set([
        "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
        "ERR_JWT_CLAIM_VALIDATION_FAILED",
      ]);
      const invalidNames = new Set([
        "JWTInvalid",
        "JWTClaimValidationFailed",
        "JWSSignatureVerificationFailed",
      ]);
      if (invalidCodes.has(error?.code) || invalidNames.has(error?.name)) {
        res.status(401).json({ message: "Invalid authorization token" });
        return;
      }
      next(error);
    }
  };
}
