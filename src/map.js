// import { API_KEY } from "./conf";

const loadYScript = () => {
    const src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey='+config.apiKey;
    if (typeof ymaps === 'undefined') {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.onload = ()=>ymaps.ready(init);
        document.body.appendChild(script);
    } else {
        ymaps.ready(init)
    }
}


// feat = {
//     "type": "Feature", 
//     "id": 0, 
//     "geometry": {
//         "type": "Point", 
//         "coordinates": [55.831903, 37.411961]
//     }, 
//     "properties": {
//             "balloonContentHeader": "<font size=3><b><a target='_blank' href='https://yandex.ru'>Здесь может быть ваша ссылка</a></b></font>", 
//             "balloonContentBody": "<p>Ваше имя: <input name='login'></p><p><em>Телефон в формате 2xxx-xxx:</em>  <input></p><p><input type='submit' value='Отправить'></p>", 
//             "balloonContentFooter": "<font size=1>Информация предоставлена: </font> <strong>этим балуном</strong>", 
//             "clusterCaption": "<strong><s>Еще</s> одна</strong> метка", 
//             "hintContent": "<strong>Текст  <s>подсказки</s></strong>"
//     }
    
// }

const init = async () =>
{
    
    const InforkomMap = new ymaps.Map(
        config.parent ? config.parent : document.body,
        {
            center: config.mapCenter ? config.mapCenter : [55.76, 37.64],
            zoom: config.mapZoom ? config.mapZoom : 9,
            controls: config.mapControlsArray ? config.mapControlsArray : ["searchControl","routeButtonControl","zoomControl","fullscreenControl"],
        },
        {
            searchControlProvider: config.mapSearchProvider ? config.mapSearchProvider : "yandex#map",
        }
    )

    if (config.destroy) {
        const destroyButton = new ymaps.control.Button({
            data: {
              image: 'assets/close_icon.png',
              title: "Закрыть"
            },
            options: {
              maxWidth: [28, 150, 178],
              position: {
                top: '10px',
                right: '10px'
            }              
            },

          });
          destroyButton.events.add(["click"], (event) => {
            InforkomMap.destroy();
            const mb = document.getElementById(config.parent);
            const mbParent = mb.parentNode;
            if (mb && mbParent) {
                mbParent.remove();
                document.body.style.overflow='auto';
            }

            });
          InforkomMap.controls.add(destroyButton);
    }

    const objectManager = new ymaps.ObjectManager({
        clusterize: true,
        clusterHasBalloon: true,
    });

    objectManager.objects.options.set({
        preset: 'islands#darkOrangeCircleIcon',
        // hasBalloon: false,
        // zIndex: 500
    });

    objectManager.clusters.options.set({
        gridSize: 50,
        preset: "islands#orangeClusterIcons",
        hasBalloon: false,
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        maxZoom: 8,
        zoomMargin: [45],
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
    });

    // objectManager.objects.events.add('click', function (e,v) {
               
    //     const objId = e.get('objectId')
    //     console.log(objId);
    //     const obj = objectManager.objects.getById(objId);
    //     console.log(obj);
    // })


    const fsRequest = await fetch('https://data.inforkom.ru/api/v1/Base/Stations?data[all]&format=geojson&yandex=true');

    const geoStations = await fsRequest.json();

    
    const spinner = '<br/><i class="fa fa-spinner fa-spin fa-fw"></i> Загрузка...<br/><br/><br/><br/>';    
    geoStations.features = geoStations.features.map((e)=>{
        e.id = e.properties.id
        e.properties.balloonContentBody = '<h5>' + e.properties.hintContent + '</h5>' + e.properties.region +' '+ e.properties.address + ' ' + e.properties.position + '<hr style="border-top: 1px solid #e54d266e;">';
        e.properties.balloonContentBody += '<div id="temp-prices' + e.properties.id + '">' + spinner + '</div>'
        e.properties.balloonContentBody = '<div style="max-width: 450px;padding: 16px;">' + e.properties.balloonContentBody + '</div>';
        
        return e;
    })

    objectManager.add(geoStations);

    const baloonProducts = (products) => {
        let list = '<table style="width: 100%;text-align: left;line-height: 1.4;">'
        + '<tbody>'
        + '<tr class="head" style="font-weight: 500;color: rgba(0,0,0,0.54);">'
        + '<td>Тип топлива</td>'
        + '<td>Розн. цена</td>'
        + '<td>Действ. с</td>'
        + '</tr>';

        Object.keys(products).forEach((key) => {
            if (products.hasOwnProperty(key)) {
                list += '<tr>'
                +'<td>' + products[key].PRODUCT + '</td>'
                +'<td>' + products[key].PRICENAL + '  ' + products[key].CURRENCY + '</td>'
                +'<td>' + products[key].PRICEDATE + '</td>'
                +'</tr>'        
            }
        });    

        list += '</tbody></table>';
        return list;
    }  

    objectManager.objects.events.add('balloonopen', async (e) => {

        const object = objectManager.objects.getById(e.get('objectId'));
        const fsPriceRequest = await fetch('https://data.inforkom.ru/api/v1/base/prices?sid=' + object.properties.id)
        const fsPriceList = await fsPriceRequest.json();
        let baloon = object.properties.balloonContentBody;
        object.properties.balloonContentBody = baloon.replace(spinner,baloonProducts(fsPriceList))
        objectManager.objects.balloon.setData(object);


    });

    InforkomMap.geoObjects.add(objectManager);

    const refRequest = await fetch('https://data.inforkom.ru/api/v1/base/reference/products');

    const productReferenceRaw = await refRequest.json();

    let products;

    const listBoxItemsObjects = [
        {id:'f1',title:'Показать все АЗС'},
    ];    

    const parseProducts = ()=>{
        return Object.entries(productReferenceRaw).map(e=>{
                let groups = e[1].groups;
                let items = groups.map(g=>{
                    let prods = g.products.map(p=>{
                        return p.productId
                    })
                    return {
                        group: g.groupName,
                        id: g.groupId,
                        catId: e[1].catId,
                        products: prods
                    }
                })
                return items               
        })
    }

    if (productReferenceRaw) {
        products = parseProducts();
    }

    const excludedCategories = [401207, 259093]; // no services no gaz
    
    let filterSets = {};
    let gazFsIds = [];

    if (products.length) {
        products.forEach( pgroup => {
            pgroup.forEach(p=>{

               if (excludedCategories.indexOf(p.catId) == -1) {
                    listBoxItemsObjects.push({
                            id:p.id,
                            title:p.group
                        });
                    if (filterSets[p.id]) {
                        filterSets[p.id].concat(p.products);
                    } else {
                        filterSets[p.id] = p.products;
                    }
                }

            })
        });

        if (config.showGaz) {
                listBoxItemsObjects.push({
                    id: 'gaz',
                    title: 'ГАЗ'
                });
            const gazFSrequest = await fetch('https://data.inforkom.ru/api/v1/base/stations&data[all]&format=json&fuelcat=259093');
            const gazFS = await gazFSrequest.json();

            Object.keys(gazFS).map(i=>{
                gazFsIds.push(gazFS[i].ID)
            })
        }
                
    }

    const listBoxItems = listBoxItemsObjects.map(function (obj) {
                return new ymaps.control.ListBoxItem({
                    data: {
                        id: obj.id,
                        content: obj.title
                    },
                    state: {
                        selected: obj.id == 'f1'
                    }
                })
            }),
        reducer = function (filters, filter) {
            filters[filter.data.get('id')] = filter.isSelected();
            return filters;
        },

        
        listBoxControl = new ymaps.control.ListBox({
            data: {
                content: 'Фильтр',
                title: 'Фильтр'
            },
            items: listBoxItems,
            state: {
                expanded: false,
                filters: listBoxItems.reduce(reducer, {})
            }
        });

        InforkomMap.controls.add(listBoxControl);

        listBoxControl.events.add(['select', 'deselect'], function (e) {
            const listBoxItem = e.get('target');

            let filters = ymaps.util.extend({}, listBoxControl.state.get('filters'));
            filters[listBoxItem.data.get('id')] = listBoxItem.isSelected();
            if (filters.f1 ) {
                if (listBoxItem.data.get('id') === 'f1') {
                    listBoxItems.forEach( lbi => {
                        let lbId = lbi.data.get('id');
                        if (lbId !== 'f1') {
                            filters[lbId] = false;
                            lbi.deselect();
                        }
                    })                    
                } else {
                    filters.f1 = false;
                    listBoxItems.forEach( lbi => {
                        if (lbi.data.get('id') == 'f1') {
                            lbi.deselect();
                        }
                    })
                }
            }
            
            listBoxControl.state.set('filters', filters);
        });        

        const filterMonitor = new ymaps.Monitor(listBoxControl.state);
        filterMonitor.add('filters', function (filters) {
            objectManager.setFilter(getFilterFunction(filters));
        });
    
        const fsHasFuel = (obj,fuel_groups) => {
            let found = false;
            if (obj.properties.products.length){
                for (let fg=0;fg<fuel_groups.length;fg++){
                    let index = fuel_groups[fg];
                    for (let p=0; p<obj.properties.products.length;p++){
                        if (filterSets[index].indexOf(obj.properties.products[p]) !== -1) {
                            return true;
                        }
                    }
                }
            }
            return found;
        }

        function getFilterFunction(categories) {

            const active = Object.keys(categories).filter(id=>categories[id])
            return function (obj) {
                let result = false;
                if (categories.f1) {
                    result = true;
                } else {
                    if (categories.gaz) {
                        result = gazFsIds.indexOf(obj.properties.id) !== -1;
                    } else {
                        result = fsHasFuel(obj,active);
                    }
                }
                return result;
            }
        }

    const routeCTL = InforkomMap.controls.get('routeButtonControl');

    if (routeCTL) {
        const router = routeCTL.routePanel;
        router.getRouteAsync().then(multiRoute =>{
            multiRoute.events.once('update', function () {
                // Установим первый маршрут, у которого нет перекрытых
                // участков, в качестве активного. Откроем его балун.
                var routes = multiRoute.getRoutes();
                console.log('routes', routes);
                for (var i = 0, l = routes.getLength(); i < l; i++) {
                    var route = routes.get(i);
                    if (!route.properties.get('blocked')) {
                        multiRoute.setActiveRoute(route);
                        route.balloon.open();
                        break;
                    }
                }
            });
        })
        
    }

    const setFilter = (fn) => {
        const om = InforkomMap.geoObjects.get(0);
        console.log(fn);
        om.setFilter(fn);
    }

    window.IMap = {
        map:InforkomMap,
        handle:{
            setFilter: setFilter
        }
    };
}

// loadYScript();
let config = {};

// window.InforkomMap = (props) => {
//     config = props;
//     loadYScript();
// }

const InMap = (props) => {
    config = props;
    loadYScript();
};

export default InMap;