import { Router } from "express";

export function authRouter({ config }) {
  const router = Router();

  router.get("/clerk-public-config", (req, res) => {
    res.json({
      publishableKey: config.clerkPublishableKey,
      signInUrl: config.clerkSignInUrl,
      signUpUrl: config.clerkSignUpUrl,
      jwtTemplate: config.clerkJwtTemplate,
    });
  });

  return router;
}
