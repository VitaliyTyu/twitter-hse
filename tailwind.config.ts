import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
    content: ["./src/**/*.tsx"],
    theme: {
        extend: {
            fontFamily: {},
            colors: {
                softPink: '#fce4ec',
                lightPink: '#f8bbd0',
                hoverPink: '#f48fb1',
                customWhite: '#ffffff',
                customSlate: '#f1f5f9',
            },
        },
    },
    plugins: [],
} satisfies Config;
