const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./dist/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        heroBlue: {
          50:'#50C4ED',
          100: '#387ADF'
        },
        heroGray: {
          50:'#C4C4C4',
          100: '#DDDDDD'
        },
        heroOrange: {
          50:'#FBA834',
        },
        zenith: {
          10: '#88e7ed',
          100: '#00abc9',
          150: '#4eb7cd',
          200: '#2491ae',
          blue: '#0018ae'
        }        
      }
    },
  },
  plugins: [],
}
