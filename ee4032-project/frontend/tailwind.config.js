/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#f5f7fa",
                surface: "#ffffff",
                primary: {
                    light: "#4ade80",
                    DEFAULT: "#22c55e",
                    dark: "#16a34a",
                },
                accent: "#f59e0b",
                text: {
                    primary: "#1e293b",
                    secondary: "#64748b",
                },
            },
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [],
};
