import './style.css';
// import noUiSlider from 'nouislider';
import InMap from './map';
// import * as echarts from 'echarts';

window.toggleMenu = () => document.querySelector('.mobile-menu').classList.toggle('active');
window.btnHandler = (el) => {
    document.querySelectorAll('button.btn-block').forEach(b=>{
      b.classList.remove('active');
      el == b && el.classList.toggle('active')
    })
    
  };

window.menuItemHandler = (el,menu = false) => {
    if (el.dataset.target) {
        const target = document.getElementById(el.dataset.target) || document.querySelector('.b24-form');
        console.log(target)
        if (target) {
            menu && toggleMenu();
            window.scrollTo({
                top:target.offsetTop - 60,
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
    InMap({
        apiKey: 'fd02c6b0-6362-49ca-bc38-9f074bf537f6',
        parent: 'map_canvas',
        showGaz: false,
        destroy: true,
        mapControlsArray: ["searchControl","routeButtonControl","zoomControl"]
      });   
    setTimeout(()=>{
        holder.classList.add('active');
        document.body.style.overflow='hidden';
    },500)
}

//   const slider1 = document.getElementById('slider1');
//   const slider2 = document.getElementById('slider2');
//   const value = document.getElementById("text");

//   noUiSlider.create(slider1, {
//     start: [500],
//     connect: [true, false],
//     range: {
//         'min': 50000,
//         'max': 500000
//     },
//     pips: {
//         mode: 'positions',
//         values: [5, 20, 35, 50, 65, 80, 95],
//     },
//     step: 5000,
//     format: {
//       from: function(value) {
//             return Math.round(+value);
//         },
//       to: function(value) {
//             return Math.round(+value);
//         }
//     }
// });

// noUiSlider.create(slider2, {
//     start: [500],
//     connect: [true, false],
//     range: {
//         'min': 50000,
//         'max': 500000
//     },
//     pips: {
//         mode: 'positions',
//         values: [5, 20, 35, 50, 65, 80, 95],
//     },
//     step: 5000,
//     format: {
//       from: function(value) {
//             return Math.round(+value);
//         },
//       to: function(value) {
//             return Math.round(+value);
//         }
//     }
// });

// const setPassedLabels = (el, val) => {
//     el.querySelectorAll('.noUi-value-large').forEach( e=>{
//         if (e.dataset.value && parseInt(e.dataset.value) < val) {
//             e.previousSibling !== null && e.previousSibling.classList.add('filled')
//         } else {
//             e.previousSibling !== null && e.previousSibling.classList.remove('filled')
//         }
//     })
// }

// const displayValue = (el,val) => {
//     const place = el.parentNode.parentNode.querySelector('.calc-value');
//     if (place) {
//         place.innerText = new Intl.NumberFormat('ru-RU').format(val[0]) + ' л'
//     }
// }

// slider1.noUiSlider.on('update', (val)=>{
//     setPassedLabels(slider1,val)
//     displayValue(slider1, val)
// });
// slider2.noUiSlider.on('update', (val)=>{
//     setPassedLabels(slider2, val)
//     displayValue(slider2, val)
// });

// const chartDom = document.getElementById('charts');
// const economyChart = echarts.init(chartDom);
// let option = {
//   tooltip: {
//     trigger: 'item'
//   },
//   legend: {
//     top: '5%',
//     left: 'center'
//   },
//   series: [
//     {
//       name: 'Экономия на топливе',
//       type: 'pie',
//       radius: ['40%', '70%'],
//       avoidLabelOverlap: false,
//       itemStyle: {
//         borderRadius: [0,10,0,10],
//         borderColor: '#fff',
//         borderWidth: 2
//       },
//       label: {
//         show: false,
//         position: 'center'
//       },
//       emphasis: {
//         label: {
//           show: true,
//           fontSize: '40',
//           fontWeight: 'bold'
//         }
//       },
//       labelLine: {
//         show: false
//       },
//       data: [
//         { value: 192550, name: 'Расходы на топливо р/мес' },
//         { value: 12566, name: 'НДС' },
//         { value: 3500, name: 'Скидка на топливо' },
//         { value: 500, name: 'Управление картой' },
//       ]
//     }
//   ]
// };

// option && economyChart.setOption(option);


