import './style.css';
import noUiSlider from 'nouislider';
import gmapsInitialize from './map';

window.toggleMenu = () => document.querySelector('.mobile-menu').classList.toggle('active');
window.btnHandler = (el) => {
    document.querySelectorAll('button.btn-block').forEach(b=>{
      b.classList.remove('active');
      el == b && el.classList.toggle('active')
    })
    
  };

window.menuItemHandler = (el) => {
    console.log(el);
    if (el.dataset.target) {
        const target = document.getElementById(el.dataset.target);
        if (target) {
            const rect = target.getBoundingClientRect();
            toggleMenu();
            console.log(rect.y);
            window.scrollTo({
                top: rect.y-60,
                behavior: 'smooth'
            })
        
        }
    }
}

window.showMap = () => {
    let holder = document.getElementById('map_canvas_holder');
    if (!holder) {
        holder = document.createElement('section');
        holder.id = 'map_canvas_holder';
        document.querySelector('main').appendChild(holder)
        const map = document.createElement('div');
        map.id = 'map_canvas';
        document.querySelector('#map_canvas_holder').appendChild(map)
    } else {
        holder.classList.add('active');
    }
    gmapsInitialize();    
    setTimeout(()=>holder.classList.add('active'),500)
}

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




