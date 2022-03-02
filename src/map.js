import './map.css';

let map;
let mm;


function createFullscreenButton() {
    const controlDiv = document.createElement('div');
    // controlDiv.style.display = 'block';
    // controlDiv.style.padding = '10px';
    const button = document.createElement('a');
        button.id = 'a-fullscreen';
        button.classList.add('btn-default');
        button.innerText = 'X'
        button.onclick = function () {
            toggleFullscreen.call(this);
        };
        controlDiv.appendChild(button);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
}

function toggleFullscreen() {
    const holder = document.getElementById('map_canvas_holder');
    holder && holder.classList.remove('active');
    // google.maps.event.trigger(map, 'resize');
    // map.setOptions({'scrollwheel': !isFullsreen});
}



function gmapsInitialize(region) {
    const myLatlng = new google.maps.LatLng(55.45, 70.36);
    const myOptions = {
        zoom: 4,
        center: myLatlng,
        streetViewControl: false,
        zoomControl: true,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        gestureHandling: 'greedy'
    };

   map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
   
   createFullscreenButton();

//    let onLoadFilter = {};
//     if (getHashData('brand').length) {
//         onLoadFilter.brand = [];
//         getHashData('brand').map(function(s){
//             onLoadFilter.brand.push(decodeURI(s));
//         })
//     }

   let xhr = new XMLHttpRequest();
   xhr.open('GET', 'https://data.inforkom.ru/api/v1/base/stations&data[all]&format=geojson');
   xhr.responseType = 'json';
   xhr.send();
   xhr.onload = function() {
        let obj = xhr.response;
        if (typeof(xhr.response) === 'string') {
            obj = JSON.parse(xhr.response);
        }       
       mm = new MarkerManager(map,obj); 
   };
}

function panStation(el) {
    jQuery('html,body').animate({
        scrollTop: $("#map_canvas").offset().top
    }, 'slow');    
    let latLng = new google.maps.LatLng(parseFloat(el.dataset.lat), parseFloat(el.dataset.lng));
    // map.setZoom(14);
    // map.setCenter(latLng);
    map.setZoom(12);
    map.panTo(latLng);
    // console.log('station href', parseFloat(el.dataset.lat), parseFloat(el.dataset.lng));
}

function debounce(func, wait, immediate) {
    let timeout;
      return function executedFunction() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
};

function setHashData(k,v) {
    let h = location.hash.split('#');
    if (h[1] && h[1]!=='') {
        let data = h[1].split(';');
        let found = false;
        if (v.length === 0) {
            data = data.filter(function(e){
                return e.split('=')[0] !== k
            })
            location.hash = '#'+data.join(';');
            return;
        }

        for (let i=0; i<data.length; i++) {
            let pair = data[i].split('=');
            if (pair[0] === k) {
                found = true;
                data[i] = k+'='+v.join(',');
                continue;
            }            
        }
        if (found) {
            location.hash = '#'+data.join(';');
        } else {
            location.hash = '#'+k+'='+encodeURI(v.join(','))+';'+data.join(';');
        }
    } else {
        location.hash = '#'+k+'='+encodeURI(v.join(','));
    }
}

function getHashData(k) {
    let v = [];
    let h = location.hash.split('#');
    if (h[1] && h[1]!=='') {
        let data = h[1].split(';');
        data.map(function(keyStr){
            let pair = keyStr.split('=');
            if (pair[0] === k) v = pair[1].split(',')
        })
    }
    return v;
}

function MarkerManager(map, data) {
    this.map = map;
    this.allMarkers = [];
    this.filtredMarkers = [];
    this.selected = {};
    this.brandlist = [];
    this.fuellist = [];
    this.allowedFilterProps = ['id','infra','products','brand','rid'];
    this.notAllowedPrice = ['ГАЗПРОМНЕФТЬ'];
    // this.setDefaultIcons();
    this.infowindow = new google.maps.InfoWindow({});
    // this.getInfraReference();
    // this.initMarkers(data.features);    
    this.filterBlock = {};

    var _this = this;

    this.getInfraReference = function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://data.inforkom.ru/api/v1/base/reference/infra');
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function() {
            var obj = xhr.response;
            if (typeof(xhr.response) === 'string') {
                obj = JSON.parse(xhr.response);
            }            
            var arr = [];
            for (let i in obj) {
                if (obj.hasOwnProperty(i)) {
                    arr.push(obj[i]);
                }
            }            
            _this.infraRef = arr;
        };        
    }
    
    this.initMarkers = function(allFs) {
        for (let key in allFs) {
            let latLng = new google.maps.LatLng(allFs[key].geometry.coordinates[1], allFs[key].geometry.coordinates[0])
            let m = new google.maps.Marker({
                position: latLng,
                icon: this.markerIcon,
                id: allFs[key].properties.id,
                infra: allFs[key].properties.infra,
                products: allFs[key].properties.products,
                brand: allFs[key].properties.brand,
                name:  allFs[key].properties.name,
                address: allFs[key].properties.address,
                rid: allFs[key].properties.regionId,
                region: allFs[key].properties.region
            });
            
            m.addListener('click', function () {
                _this.click(allFs[key], m);
            });
            this.allMarkers.push(m);

            if (this.brandlist.indexOf(allFs[key].properties.brand) === -1) {
                this.brandlist.push(allFs[key].properties.brand);
            }

            allFs[key].properties.products.map(function(pid){
                if (_this.fuellist.indexOf(pid) === -1) {
                    _this.fuellist.push(pid);
                }                
            })
            
        }
        this.refreshMap();
    }
    
    this.click = function(data, marker) {
        this.infowindow.close();
        let pos = new google.maps.LatLng(data.geometry.coordinates[1], data.geometry.coordinates[0]);
        if (this.selected.id) {
            this.selected.setIcon(this.markerIcon)
        }
        marker.setIcon(this.slectedFsIcon);
        this.selected = marker;

        this.map.panTo(pos);
        let contentStr = '<h5>' + data.properties.hintContent + '</h5>';
        contentStr += data.properties.address + ' ' + data.properties.position + '<hr style="border-top: 1px solid #e54d266e;">';
        let spinner = '<br/><i class="fa fa-spinner fa-spin fa-fw"></i> Загрузка...<br/><br/><br/><br/>';
        contentStr += '<div id="temp-prices' + data.properties.id + '">' + spinner + '</div>';
        contentStr = '<div style="max-width: 450px;padding: 16px;">' + contentStr + '</div>';
        this.infowindow = new google.maps.InfoWindow({
            content: contentStr
        });
        let skip = this.notAllowedPrice.indexOf(data.properties.brand) !== -1;
        this.infowindow.open(this.map, marker);
        let _this = this;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://data.inforkom.ru/api/v1/base/prices?sid=' + data.properties.id);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function () {
            let obj = xhr.response;
            if (typeof(xhr.response) === 'string') {
                obj = JSON.parse(xhr.response);
            }            
            let prods = skip ? '': _this.infowindowProductsHtml(obj);
            let productsHtml = prods + _this.infowindowInfraHtml(data.properties.infra);
            _this.infowindow.setContent(contentStr.replace(spinner, productsHtml));
        };

    }  
    
    this.infowindowProductsHtml = function(products) {
        let list = '<table style="width: 100%;text-align: left;line-height: 1.4;">'
        + '<tbody>'
        + '<tr class="head" style="font-weight: 500;color: rgba(0,0,0,0.54);">'
        + '<td>Тип топлива</td>'
        + '<td>Розн. цена</td>'
        + '<td>Действ. с</td>'
        + '</tr>';

        Object.keys(products).forEach(function(key) {
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

    this.infowindowInfraHtml = function(infra) {
        var list = '<div class="fs-options" style="text-align: left;">';
        var fontmap = {
                          "2841538" : "inforcomic-moyka", //мойка грузовых
                          "2841540" : "inforcomic-moyka", //мойка легковых
                          "86373559" : "inforcomic-moyka", //автомойка
                          "11656705" : "inforcomic-wifi", //wifi
                          "2841526" : "inforcomic-wc", // туалет new
                          "4441564" : "inforcomic-terminal",  //теминал оплаты услуг
                          "2863724" : "inforcomic-stoyanka",  //стоянка
                          "9906972" : "inforcomic-stoyanka",  //стоянка
                          "9907037" : "inforcomic-remont",  //автосервис
                          "2841504" : "inforcomic-magaz",  //магазин
                          "2841501" : "inforcomic-kafe1",  //кафе
                          "2841530" : "inforcomic-hotel",  //отель
                          "2841527" : "inforcomic-dush",  //душ
                          "11219376" : "inforcomic-bankomat",  //банкомат             
        };
        
       for (var i = 0; i < infra.length; i++) {
                   if (fontmap[infra[i]]) {
                       let item = this.infraRef.filter(function(obj){
                           return obj.ID === infra[i];
                       });
                       list += '<span class="'+fontmap[infra[i]]+'" title="'+item[0].FULLNAME+'" data-toggle="tooltip"  data-placement="right"></span>';
                   }
       }
       
       list += '</div>';
       return list;
    }  
    
    this.setFilter = function(filter) {
        // this.allMarkers.map(m => {
        //     if (m.id  === 117323968 ) {
        //         console.log(m)
        //     }
        // });
        this.filter = filter;
        if (!this.filterApplied()) this.filter = {};

        this.filtredMarkers = [];
        let bounds = new google.maps.LatLngBounds();
        let ANDcase = Object.keys(this.filter).length > 1;
        let counter = 0;
        for (let fname in this.filter) {
            if (this.allowedFilterProps.indexOf(fname) === -1) continue;

            if (this.filter.hasOwnProperty(fname)) {
                let fval = this.filter[fname];
                if (!Array.isArray(fval)) {
                    console.log('fname value must be an array');
                    continue;
                }
                if (!fval.length) continue;
                if (ANDcase && counter > 0) {
                    let _filtred = [];
                    for (let m in this.filtredMarkers) {
                        if (this._checkArgs(fval, this.filtredMarkers[m][fname])) {
                            this.filtredMarkers[m].setIcon(this.markerIcon);
                            _filtred.push(this.filtredMarkers[m]);
                            bounds.extend(this.filtredMarkers[m].getPosition());
                        }
                    }
                    this.filtredMarkers = _filtred;                    
                } else {
                    for (let m in this.allMarkers) {
                        if (this._checkArgs(fval, this.allMarkers[m][fname])) {
                            this.allMarkers[m].setIcon(this.markerIcon);
                            this.filtredMarkers.push(this.allMarkers[m]);
                            bounds.extend(this.allMarkers[m].getPosition());
                        }
                    }
                }    
                counter ++;
            }
        }
        this.refreshMap();
        if (this.filter.rid) this.map.fitBounds(bounds);
    }    

    this._checkArgs = function(arg,val) {
        if (!Array.isArray(val)) {
            return arg.indexOf(val) !== -1;
        } else {
            for (let item in val) {
                if (arg.indexOf(val[item]) !== -1){
                    return true;
                }                
            }
        }
    }   
    
    this.filterApplied = function() {
        let isset = false;
        let _this = this;
        if (this.filter) {
            Object.keys(this.filter).map(function(flts){
                if (_this.filter[flts].length) isset = true;
            });
        }
        return isset;
    }

    this.refreshMap = function() {
        if (this.markerCluster) {
            this.markerCluster.clearMarkers();
          }
        let scope = this.filterApplied() ? this.filtredMarkers : this.allMarkers;
        this.markerCluster = new MarkerClusterer(this.map, scope,this.clusterOptions);
    }   
    
    this.clearClusters = function() {
        this.markerCluster.clearMarkers();
    }   
    
    this.setDefaultIcons = function() {
        this.clusterOptions = {
            imagePath: '/assets/cluster/cluster-icon-o',
            maxZoom: 13 
        };
        this.markerIcon = {
                        url: "/assets/images/map-station@2x.png" ,
                        scaledSize: new google.maps.Size(32, 32),
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(0, 0)
        };
        this.slectedFsIcon = {
            url: "/assets/images/map-station@2x.png" ,
            scaledSize: new google.maps.Size(36, 36),
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(0, 0)
        };
    }

    this.setCustomIcons = function() {
        this.clusterOptions = {
            imagePath: '/assets/cluster/cluster-icon-g',
            maxZoom: 13 
        };
        this.markerIcon = {
                        url: "/assets/images/map-station-gas@2x.png" ,
                        scaledSize: new google.maps.Size(32, 32),
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(0, 0)
        };
        this.slectedFsIcon = {
            url: "/assets/images/map-station-gas@2x.png" ,
            scaledSize: new google.maps.Size(36, 36),
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(0, 0)
        };
    }  
    
    this.getFsdata = function() {
        let scope = this.filterApplied() ? this.filtredMarkers : this.allMarkers;
        let data = [];
        for (let i in scope) {
            data.push({
                id: scope[i].id,
                region: scope[i].region,
                name: scope[i].name,
                address: scope[i].address,
                lat: scope[i].getPosition().lat(),
                lng: scope[i].getPosition().lng()
            });
        }
        return data;
    }  
    
    this.renderFilter = function() {
        this.filterBlock = new FSfilter(this);
        return this.filterBlock.makeView('#map_canvas');
    }
    
    this.setDefaultIcons();
    this.getInfraReference();
    this.initMarkers(data.features);      
    
}

function FSfilter(data) {
    this.manager = data;
    this.reference = [];
    this.fuelButtons = [];
    this.restrictedProductGroups = ["ДТ сезон","Мойка","Доп. услуги","Стоянка","ТС-1"];
    this.shownProductGroups = ['ДТ евро','АИ-92','АИ-95','АИ-100', 'AdBlue'];  
    
    this.setFilterFromUrl = function () {
        let _this = this;
        if (getHashData('products').length) {
            getHashData('products').map(function(s){
                _this.reference.map(function(g){
                    if (decodeURI(s) == g.name) {
                        _this.filterByProductGroup(g.gid, true);
                    }
                });
                _this.fuelButtons.map(function(b){
                    if (decodeURI(s).replace('АИ-','') == b.innerHTML) {
                        b.classList.add('active');
                    }
                });                
            });
        }          

        if (getHashData('brand').length) {
            let brands = [];
            getHashData('brand').map(function(s){
                brands.push(decodeURI(s));
                _this.makeFilteredBrandBlock(decodeURI(s));
                _this.filerByBrand(decodeURI(s))
            });
            // this.manager.setFilter({brand:brands});
        }
    }

    this.makeView = function(parentSelector) {
        let _this = this;

        let holder = document.createElement('div');
        holder.id = 'fholder';
        let head = document.createElement('div');
        head.id = 'fhead';
        let geosearch = document.createElement('div');
        geosearch.id = 'fgeos';
        let ficon = document.createElement('div');
        ficon.id = 'ficon';
        ficon.innerHTML = '<i class="fa fa-filter" aria-hidden="true"></i>';
        let sholder = document.createElement('div');
        sholder.style.cssText = 'flex-grow: 5;border-bottom: 1px solid #cecece;';
        let sinput = document.createElement('input');
        sinput.id = 'geosinput';
        sinput.placeholder = 'Поиск по карте';
        let licon = document.createElement('div');
        licon.id='licon';
        licon.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
        sholder.appendChild(sinput);
        geosearch.appendChild(ficon);
        geosearch.appendChild(sholder);
        geosearch.appendChild(licon);
        let headtitle = document.createElement('div');
        headtitle.id = 'fheadtitle';
        let htitleText = document.createElement('div');
        htitleText.classList.add('filter_title')
        htitleText.innerHTML = "Фильтры";
        // htitleText.style.cssText = 'flex-grow:5;padding-left:10px;padding-top:3px;font-weight:400;color: #767676;';
        let htitleicons = document.createElement('div');
        htitleicons.classList.add('htitleicons');
        let xlsbtn = document.createElement('div');
        xlsbtn.innerHTML = '<i class="fa fa-floppy-o" aria-hidden="true"></i>';
        xlsbtn.onclick = function() {
            _this.xlsExport();
        }        
        let resetbtn = document.createElement('div');
        resetbtn.style.color = '#ba0000';
        resetbtn.innerHTML = '<i class="fa fa-trash-o" aria-hidden="true"></i>';
        resetbtn.onclick = function() {
            _this.resetFilter();
        }        
        let togglebtn = document.createElement('div');
        togglebtn.innerHTML = '<i class="fa fa-chevron-down" aria-hidden="true"></i>';
        togglebtn.style.color='#faa200';
        togglebtn.onclick = function(e) {
            _this.toggleView(e);
        }
        htitleicons.appendChild(xlsbtn);
        htitleicons.appendChild(resetbtn);
        htitleicons.appendChild(togglebtn);
        headtitle.appendChild(htitleText);
        headtitle.appendChild(htitleicons);

        head.appendChild(geosearch);
        head.appendChild(headtitle)
        holder.appendChild(head);
        document.querySelector(parentSelector).appendChild(holder);
        
        let ac = new google.maps.places.Autocomplete(sinput, {
            bounds: _this.manager.map.getBounds(),
            types: ['geocode']
        });
        ac.setFields(['geometry']);
        ac.addListener('place_changed',function(){
            let place = ac.getPlace();
            _this.manager.map.panTo(place.geometry.location);
            _this.manager.map.setZoom(10);
        });

        this.filterarea = document.createElement('div');
        this.filterarea.id = 'ftogbl';
        let fueltitle = document.createElement('div');
        fueltitle.innerHTML = 'Вид топлива';
        fueltitle.classList.add('f_title');
        this.fuelTypesHolder = document.createElement('div');
        this.fuelTypesHolder.id = 'f_types';

        this.spareFuelTypesHolder = document.createElement('div');
        this.spareFuelTypesHolder.id = 'f_types_side';

        this.makeFuelTypesBtns();

        this.filterarea.appendChild(fueltitle);
        this.filterarea.appendChild(this.fuelTypesHolder);
        this.filterarea.appendChild(this.spareFuelTypesHolder);

        let brandtitle = document.createElement('div');
        brandtitle.innerHTML = 'Сеть АЗС';
        brandtitle.classList.add('b_title');    
        this.filterarea.appendChild(brandtitle);
        let bsholder = document.createElement('div');    
        bsholder.classList.add('bsholder');
        let brandSelect = document.createElement('input');
        let dropDown = document.createElement('div');
        dropDown.classList.add('brandDropDown');
        brandSelect.oninput = debounce(function(e) {
              _this.searchBrand(e.target.value.toLowerCase(), dropDown)  
              }, 500);
        bsholder.appendChild(brandSelect);
        bsholder.appendChild(dropDown);
        this.filterarea.appendChild(bsholder);    

        this.filtredBrandsHolder = document.createElement('div');
        this.filtredBrandsHolder.id = 'f_brands';
        this.filterarea.appendChild(this.filtredBrandsHolder);

        holder.appendChild(this.filterarea);


        return holder;
    }  
    
    this.searchBrand = function(val,parent) {
        let _this = this;
        while (parent.lastElementChild) {
            parent.removeChild(parent.lastElementChild);
        }

        let list = this.manager.brandlist;
        let found = [];
        list.map(function(brand){
            if (brand.toLowerCase().indexOf(val) !== -1) {
                found.push(brand);
            }
        })
        let checkEnabled = function(name) {
            let state = _this.manager.filter;
            let enabled = false;
            if (state && state.brand) {
                if (state.brand.indexOf(name) !== -1) enabled = true;
            }
            return enabled;
        }
        if (found.length) {
            let ul = document.createElement('ul');
            for (let i = 0; i<found.length; i++) {
                let li = document.createElement('li');
                li.innerHTML = found[i];
                li.onclick = function(e) {
                    parent.classList.remove('found');
                    let filter_val = found[i];
                    if (filter_val === undefined) {
                        filter_val = e.target.innerHTML;
                    }

                    if (!checkEnabled(filter_val)) {
                        _this.filerByBrand(filter_val);
                        _this.makeFilteredBrandBlock(filter_val);
                    }
                }
                ul.appendChild(li)
            }
            parent.appendChild(ul);
            parent.classList.add('found');
        } else {
            parent.classList.remove('found');
        }
    }

    this.filerByBrand = function(val) {
        let state = this.manager.filter;
        if (state && state.brand) {
            state.brand.push(val)
        } else {
            if (state === undefined) state = {};
            state.brand = [val];
        }
        this.manager.setFilter(state);

        let hash = getHashData('brand');
        let _n_hash = [];
        hash.map(function(i){
            if (decodeURI(i) !== val) {
                _n_hash.push(decodeURI(i));        
            }
        });
        _n_hash.push(val);        
        setHashData('brand',_n_hash);
    }    

    this.makeFilteredBrandBlock = function(val) {

        let _this = this;
        let block = document.createElement('div');
        block.innerHTML = val;
        block.onclick = function(e) {
            $(block).remove();
            let state = _this.manager.filter;
            let newState = [];
            state.brand.map(function(name){
                if (name !== val) newState.push(name);
            });
            state.brand = newState;
            _this.manager.setFilter(state);
            let hash = getHashData('brand');
            hash.splice(hash.indexOf(encodeURI(val)),1);
            setHashData('brand',hash);
        }
        _this.filtredBrandsHolder.appendChild(block);

    }  
    
    this.makeFuelTypesBtns = function() {
        let _this = this;
        let xhr = this.getProductReference();
        xhr.onload = function() {
            let obj = xhr.response;
            if (typeof(xhr.response) === 'string') {
                obj = JSON.parse(xhr.response);
            }
            Object.keys(obj).map(function(cat){
                obj[cat].groups.map(function(group){
                    if (_this.restrictedProductGroups.indexOf(group.groupName) === -1) {
                        _this.reference.push({
                            name: group.groupName,
                            gid: group.groupId,
                            products: group.products
                        })                        
                    }
                })
            })
            _this.reference.map(function(g){
                    let btn = document.createElement('div');
                    btn.innerHTML = g.name.replace('АИ-','');
                    btn.onclick = function() {
                        btn.classList.toggle('active');
                        _this.filterByProductGroup(g.gid, btn.classList.contains('active'));
                    }
                    if (_this.shownProductGroups.indexOf(g.name) !== -1) {
                        _this.fuelTypesHolder.appendChild(btn);
                    } else {
                        _this.spareFuelTypesHolder.appendChild(btn);
                    }
                    _this.fuelButtons.push(btn);
            });
            
            let moreFuelBtn = document.createElement('div');
            moreFuelBtn.innerHTML = '+';
            moreFuelBtn.onclick = function() {
                _this.spareFuelTypesHolder.classList.toggle('active');
            }
            _this.fuelTypesHolder.appendChild(moreFuelBtn);
            _this.setFilterFromUrl();
        }
    }  
    
    this.filterByProductGroup = function(gid, status) {
        let state = this.manager.filter || {};
        let productsState = state.products || [];
        let group = this.getProductsByGroup(gid);
        let newState = [];
        if (!status) {
            productsState.map(function(id){
                if (group.indexOf(id) === -1) {
                    newState.push(id)
                }
            });
        } else {
            newState = productsState.length ? productsState.concat(group) : group;
        }
        state.products = newState;
        this.manager.setFilter(state);  
        let hash = getHashData('products');
        let _n_hash = [];
        let gname = '';
        this.reference.map(function(g){
            if (g.gid === gid) gname = g.name;
        })

        if (!status) {
            hash.map(function(i){
                if (decodeURI(i) !== gname) {
                    _n_hash.push(decodeURI(i));        
                }
            });            
        } else {
            hash.map(function(i){
                if (decodeURI(i) !== gname) {
                    _n_hash.push(decodeURI(i));        
                }
            });
            _n_hash.push(gname);
        }
        setHashData('products',_n_hash);
    }   
    
    this.getProductsByGroup = function(gid) {
        let products = [];
        this.reference.map(function(group){
            if (group.gid === gid) {
                group.products.map(function(pobj){
                    products.push(pobj.productId)
                })
            }
        })
        return products;
    }

    this.getGroupByProduct = function(pid) {
        let response;
        this.reference.map(function(group){
            group.products.map(function(p){
                if (p.productId === pid) response = group;     
            })
            
        })        
        return response;
    } 
    
    this.getProductReference = function() {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://data.inforkom.ru/api/v1/base/reference/products');
        xhr.responseType = 'json';
        xhr.send();
        return xhr;
    }  
    
    this.toggleView = function(e) {
        let i = e.target.querySelector('i') || e.target;
        if (i.classList.contains('fa-chevron-down')) {
            i.classList.remove('fa-chevron-down');
            i.classList.add('fa-chevron-up');
            this.spareFuelTypesHolder.classList.remove('active');
        } else {
            i.classList.remove('fa-chevron-up');
            i.classList.add('fa-chevron-down');
        }
        this.filterarea.classList.toggle('minimized');
    }    

    this.resetFilter = function() {
        this.manager.setFilter({});
        this.fuelButtons.map(function(btn){
            btn.classList.remove('active');
            });
        while (this.filtredBrandsHolder.lastElementChild) {
            this.filtredBrandsHolder.removeChild(this.filtredBrandsHolder.lastElementChild);
        }            
    }  
    
    this.xlsExport = function() {
        // console.log('xlsExport')
        // console.log(this.manager)
        // console.log(this)
        let filename = "inforkom_fslist.xlsx";
        
        let data = [['N','Регион','Название', 'Адрес', 'GPS', '80', '92', '95', '98', '100', 'ДТ']];
        let n = 1;
        let _this = this;
        this.manager.filtredMarkers.map(function(m) {
            let f80='нет',f92='нет',f95='нет',f98='нет',dt='нет',f100='нет'; 
            if (m.products.length) {
                m.products.map(function(pid){
                    let group = _this.getGroupByProduct(pid);
                    if (group) {
                        let gname = group.name;
                        if (_this.shownProductGroups.indexOf(gname) !== -1) {
                            let stripped = gname.replace('АИ-','')
                                .replace(' зима','')
                                .replace(' лето','')
                                .replace(' ТУ','')
                                .replace(' евро','');
                            switch(stripped) {
                                case('80') :
                                    f80 = 'да';
                                    break;
                                case('92') :
                                    f92 = 'да';
                                    break;
                                case('95') :
                                    f95 = 'да';
                                    break;                                
                                case('98') :
                                    f98 = 'да';
                                    break; 
                                case('100') :
                                    f100 = 'да';
                                    break;                                                                    
                                case('ДТ') :
                                    dt = 'да';
                                    break;                                
                            }
                        }
                    }
                })
            }

            let row = [n,m.region,m.name,m.address,m.position.lat()+':'+m.position.lng(),f80,f92,f95,f98,f100,dt];
            n++;
            data.push(row);
        });
        
        let ws_name = "SheetJS", wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.writeFile(wb, filename);

    }      
}

function showFsTable() {
    let data = mm.getFsdata();
    if (data.length) {
        let table = '<table class="table table-stripped table-bordered sppb-col-sm-12">'; 
        table += '<tr><th>№</th><th style="width:80%">Наименование АЗС</th><th>Координаты</th></tr>';
        let i = 0;
        for (let index in data) {
            let item = data[index];
                i++;
                let fsaddress = item.address ? item.address : ''
                table += '<tr><td>'+i+'</td><td><span href="#map" onclick="panStation(this)" style="color:#c13a17;cursor:pointer" class="station-link" data-lat="'+item.lat+'"data-lng="'+item.lng+'">'+item.name + ' ' + fsaddress + '</span></td>';
                table += '<td>'+item.lat.toFixed(4)+','+item.lng.toFixed(4)+'</td></tr>';
        }
        table += '</table>';
        let holder = document.querySelector('.fs-table-content');
            holder.innerHTML = table;
    }         
}

export default gmapsInitialize;