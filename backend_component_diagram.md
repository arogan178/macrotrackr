graph LR
Elysia((Elysia Instance))
CORS[CORS Middleware]
JWT[JWT Middleware]
SQLite((SQLite Database))

    subgraph Auth Endpoints
        validate_email[/api/auth/validate-email]
        register_complete[/api/auth/register-complete]
        login[/api/auth/login]
    end

    subgraph User Endpoints
        user_me[/api/user/me]
        user_settings[/api/user/settings]
        user_complete_profile[/api/user/complete-profile]
    end

    subgraph Macro Endpoints
        macro_entry[/api/macro_entry]
        macros_history[/api/macros/history]
        macro_entry_id[/api/macro_entry/:id]
    end

    Elysia --> CORS
    Elysia --> JWT
    Elysia --> SQLite
    Elysia --> Auth Endpoints
    Elysia --> User Endpoints
    Elysia --> Macro Endpoints

    Auth Endpoints --> SQLite
    User Endpoints --> SQLite
    Macro Endpoints --> SQLite
