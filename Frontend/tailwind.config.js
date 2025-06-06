import daisyui from "daisyui";

export default {
    content: ["./src/**/*.{html,js,vue}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            boxShadow: {
                soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
            },
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                light: {
                    primary: "#3b82f6", // Bright blue
                    secondary: "#10b981", // Emerald green
                    accent: "#8b5cf6", // Purple
                    neutral: "#1f2937",
                    "base-100": "#ffffff",
                    "base-200": "#f9fafb",
                    "base-300": "#f3f4f6",
                    info: "#3b82f6",
                    success: "#10b981",
                    warning: "#f59e0b",
                    error: "#ef4444",
                },
                dark: {
                    primary: "#3b82f6",
                    secondary: "#10b981",
                    accent: "#8b5cf6",
                    neutral: "#d1d5db",
                    "base-100": "#1f2937",
                    "base-200": "#111827",
                    "base-300": "#0f172a",
                    info: "#3b82f6",
                    success: "#10b981",
                    warning: "#f59e0b",
                    error: "#ef4444",
                },
            },
        ],
    },
};
