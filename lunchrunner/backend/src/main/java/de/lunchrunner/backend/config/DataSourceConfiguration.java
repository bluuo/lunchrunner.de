package de.lunchrunner.backend.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfiguration {

    private final Environment environment;

    public DataSourceConfiguration(Environment environment) {
        this.environment = environment;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        String jdbcUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        String username = environment.getProperty("SPRING_DATASOURCE_USERNAME");
        String password = environment.getProperty("SPRING_DATASOURCE_PASSWORD");
        if ((jdbcUrl == null || jdbcUrl.isBlank())) {
            String databaseUrl = environment.getProperty("DATABASE_URL");
            if (databaseUrl != null && !databaseUrl.isBlank()) {
                ParsedDatabaseUrl parsed = parseDatabaseUrl(databaseUrl);
                jdbcUrl = parsed.jdbcUrl();
                if (username == null || username.isBlank()) {
                    username = parsed.username();
                }
                if (password == null || password.isBlank()) {
                    password = parsed.password();
                }
            }
        }
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            throw new IllegalStateException("Database URL is not configured");
        }
        DataSourceBuilder<?> builder = DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(jdbcUrl);
        if (username != null) {
            builder.username(username);
        }
        if (password != null) {
            builder.password(password);
        }
        return builder.build();
    }

    private ParsedDatabaseUrl parseDatabaseUrl(String databaseUrl) {
        try {
            URI uri = new URI(databaseUrl);
            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null) {
                String[] parts = userInfo.split(":", 2);
                username = parts.length > 0 ? parts[0] : null;
                password = parts.length > 1 ? parts[1] : null;
            }
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                throw new IllegalArgumentException("Database name missing in DATABASE_URL");
            }
            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
            if (uri.getQuery() != null) {
                jdbcUrl = jdbcUrl + "?" + uri.getQuery();
            }
            return new ParsedDatabaseUrl(jdbcUrl, username, password);
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Invalid DATABASE_URL format", ex);
        }
    }

    private record ParsedDatabaseUrl(String jdbcUrl, String username, String password) {
    }
}
