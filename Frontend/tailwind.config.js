import daisyui from 'daisyui';

export default { 
  content: ["./src/**/*.{html,js,vue}"],
  theme: { 
    extend: {} 
  },
  plugins: [ daisyui ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#2c3e50",
          "secondary": "#42b983",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
        }
      },
    ],
  }
}