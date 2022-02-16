import './style.css';
import debounce from 'lodash/debounce'
import noUiSlider from 'nouislider'

window.toggleMenu = () => document.querySelector('.mobile-menu').classList.toggle('active');
window.btnHandler = (el) => {
    document.querySelectorAll('button.btn-block').forEach(b=>{
      b.classList.remove('active');
      el == b && el.classList.toggle('active')
    })
    
  };



  const slider1 = document.getElementById('slider1');
  const slider2 = document.getElementById('slider2');
  const value = document.getElementById("text");

  noUiSlider.create(slider1, {
    start: [500],
    connect: [true, false],
    range: {
        'min': 50000,
        'max': 500000
    },
    pips: {
        mode: 'positions',
        values: [5, 20, 35, 50, 65, 80, 95],
    },
    step: 5000,
    format: {
      from: function(value) {
            return Math.round(+value);
        },
      to: function(value) {
            return Math.round(+value);
        }
    }
});

noUiSlider.create(slider2, {
    start: [500],
    connect: [true, false],
    range: {
        'min': 50000,
        'max': 500000
    },
    pips: {
        mode: 'positions',
        values: [5, 20, 35, 50, 65, 80, 95],
    },
    step: 5000,
    format: {
      from: function(value) {
            return Math.round(+value);
        },
      to: function(value) {
            return Math.round(+value);
        }
    }
});

const setPassedLabels = (el, val) => {
    el.querySelectorAll('.noUi-value-large').forEach( e=>{
        if (e.dataset.value && parseInt(e.dataset.value) < val) {
            e.previousSibling !== null && e.previousSibling.classList.add('filled')
        } else {
            e.previousSibling !== null && e.previousSibling.classList.remove('filled')
        }
    })
}

const displayValue = (el,val) => {
    const place = el.parentNode.parentNode.querySelector('.calc-value');
    if (place) {
        place.innerText = new Intl.NumberFormat('ru-RU').format(val[0]) + ' л'
    }
}

slider1.noUiSlider.on('update', (val)=>{
    setPassedLabels(slider1,val)
    displayValue(slider1, val)
});
slider2.noUiSlider.on('update', (val)=>{
    setPassedLabels(slider2, val)
    displayValue(slider2, val)
});
