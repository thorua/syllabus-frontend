/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "uam-blue": "#0069A3",
        "uam-blue-dark": "#004e7a",
        "uam-blue-darker": "#003a5c",
        "uam-yellow": "#F4D73B",
        "uam-yellow-dark": "#d4b82a",
        "uam-gray-dark": "#575757",
        "uam-gray-mid": "#B2B2B2",
        "uam-gray-light": "#EDEDED",
        "uam-purple": "#421A75",
        "uam-magenta": "#C20590",
        "uam-pink": "#CE0071",
        "uam-orange": "#E36727",
        "uam-amber": "#EC992D",
        "uam-green": "#9CD04D",
        "uam-sage": "#77BB89",
        "uam-sky": "#0090D0",
      },
      fontFamily: {
        sans: ['"Fira Sans"', '"Trebuchet MS"', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'uam': '0 1px 3px 0 rgba(0, 105, 163, 0.1), 0 1px 2px -1px rgba(0, 105, 163, 0.1)',
        'uam-md': '0 4px 6px -1px rgba(0, 105, 163, 0.1), 0 2px 4px -2px rgba(0, 105, 163, 0.1)',
        'uam-lg': '0 10px 15px -3px rgba(0, 105, 163, 0.1), 0 4px 6px -4px rgba(0, 105, 163, 0.1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
