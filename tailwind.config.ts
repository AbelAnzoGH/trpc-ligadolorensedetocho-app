import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1E40AF',
                secondary: '#FBBF24',
                teriary: '#10B981',
                quaternary: '#F87171',
            },
            fontFamily: {
                sans: ["Poppins", "sans-serif"],
            },
            container:{
                center: true,
                padding: '1rem',
                screens: {
                    lg : '1125px',
                    xl : '1125px',
                    '2xl'  : '1125px'
                }
            },
            
        }

    },
    plugins:[],
};

export default config;