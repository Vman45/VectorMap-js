/*===========================================================================*/
// Education Achievement - Pie Chart
// Sample map by ThinkGeo
// 
//   1. ThinkGeo Cloud API Key
//   2. Map Control Setup
//   3. Pie Chart Overlay Setup
//   4. Tile Loading Event Handlers
/*===========================================================================*/


/*---------------------------------------------*/
// 1. ThinkGeo Cloud API Key
/*---------------------------------------------*/

// First, let's define our ThinkGeo Cloud API key, which we'll use to
// authenticate our requests to the ThinkGeo Cloud API.  Each API key can be
// restricted for use only from a given web domain or IP address.  To create your
// own API key, you'll need to sign up for a ThinkGeo Cloud account at
// https://cloud.thinkgeo.com.
const apiKey = 'WPLmkj3P39OPectosnM1jRgDixwlti71l8KYxyfP2P0~';


/*---------------------------------------------*/
// 2. Map Control Setup
/*---------------------------------------------*/

// Now we'll create the base layer for our map.  The base layer uses the ThinkGeo
// Cloud Maps Raster Tile service to display a detailed map and its the map style is dark.  For more
// info, see our wiki:
// https://wiki.thinkgeo.com/wiki/thinkgeo_cloud_maps_raster_tiles
let baseLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: `https://cloud.thinkgeo.com/api/v1/maps/raster/dark/x1/3857/512/{z}/{x}/{y}.png?apiKey=${apiKey}`,
        tileSize: 512,
    }),
});

// Create and initialize our interactive map.
let map = new ol.Map({
	renderer: 'webgl',
    loadTilesWhileAnimating: true,
    loadTilesWhileInteracting: true,
    // Add our previously-defined ThinkGeo Cloud Raster Tile layer to the map.
    layers: [baseLayer],
    // States that the HTML tag with id="map" should serve as the container for our map.
    target: 'map',
    // Create a default view for the map when it starts up.
    view: new ol.View({
        // Center the map on the United States and start at zoom level 4.
        center: ol.proj.fromLonLat([-95.940014, 37.331607]),
        maxResolution: 40075016.68557849 / 512,
        zoom: 4,
        minZoom: 1,
        maxZoom: 19,
        progressiveZoom: false,
    })
});

// Add a button to the map that lets us toggle full-screen display mode.
map.addControl(new ol.control.FullScreen());


/*---------------------------------------------*/
// 3. Pie Chart Overlay Setup
/*---------------------------------------------*/

// This next part sets up the pie chart overlay on our map. On each pie chart, 
// we'll display the education achievement in major US cities for 2016, ages 25 and older.

// This method allows us to set the positon, value and style for every pie chart, then get a new overlay.
const createPieChartOverlay = (id, data, coord) => {
    let option = {
        tooltip: {
            trigger: 'item',
            formatter: "{b} : {d}%"
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: data,
            label: {
                normal: {
                    show: false,
                }
            },
            itemStyle: {
                emphasis: {
                    shadowBlur: 0,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    let chart = echarts.init(document.getElementById(id));
    chart.setOption(option);
    let overlay = new ol.Overlay({
        position: coord,
        positioning: 'center-center',
        element: document.getElementById(id),
        stopEvent: false
    });
    return overlay;
}

// Now that we've set up our map's base layer and the each overlay for our data, 
// we need to actually load the point data layer that will let us visualize Education 
// Achievement on the map. We'll load it from a small GeoJSON file hosted on our servers.
const getJson = (filePath) => {
    let readTextFile = new Promise(function (resolve, reject) {
        let rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", filePath, true);
        rawFile.onreadystatechange = function (ERR) {
            if (rawFile.readyState === 4) {
                if (rawFile.status == "200") {
                    resolve(rawFile.responseText);
                } else {
                    reject(new Error(ERR));
                }
            }
        }
        rawFile.send(null);
    });
    return readTextFile;
}

// Once the GeoJSON file has been fully downloaded, just get the value what you need and 
// pass it to our createPieChartOverlay method to create its overlay. Then add the new 
// overlay to our map.
getJson('../data/education.geojson').then(function (data) {
    let stateArr = [];
    let featureCollection = JSON.parse(data)['features'];
    let length = featureCollection.length;
    
    for (let i = 0; i < length; i++) {
        // Create the HTML tag which should serve as the container for each pie chart.
        let aqiDiv = document.createElement("div");
        aqiDiv.id = `pieChart${i}`;
        aqiDiv.style = "height:100px;width:100px";
        document.querySelector("#pieChart").appendChild(aqiDiv);

        // Get the value what we need from the GeoJSON file data.
        let feature = featureCollection[i];
        let item = feature['properties'];
        let coor = feature['geometry']['coordinates'];
        let bcav = item.Bcav;
        let Col = item.Col;
        let HS = item.HS;
        let UHSC = item.UHSC;

        // Set the captions and color for every piece of the pie chart.
        stateArr.push([]);
        stateArr[i].push({
            value: UHSC,
            name: `Grade School `,
            itemStyle: {
                color: '#fe0100',
            }
        });
        stateArr[i].push({
            value: HS,
            name: ' High School ',
            itemStyle: {
                color: '#f9ff00'
            }
        });
        stateArr[i].push({
            value: Col,
            name: `College 2+ Years`,
            itemStyle: {
                color: '#a4e601'
            }
        });
        stateArr[i].push({
            value: bcav,
            name: `College 4+ Years`,
            itemStyle: {
                color: '#1e86fe'
            }
        });
        let index = `pieChart${i}`;
        map.addOverlay(createPieChartOverlay(index, stateArr[i], ol.proj.fromLonLat(coor)));
    }
})


/*---------------------------------------------*/
// 4. Tile Loading Event Handlers
/*---------------------------------------------*/

// These events allow you to perform custom actions when 
// a map tile encounters an error while loading.
const errorLoadingTile = () => {
    const errorModal = document.querySelector('#error-modal');
    if (errorModal.classList.contains('hide')) {
        // Show the error tips when Tile loaded error.
        errorModal.classList.remove('hide');
    }
}

const setLayerSourceEventHandlers = (layer) => {
    let layerSource = layer.getSource();
    layerSource.on('tileloaderror', function () {
        errorLoadingTile();
    });
}

setLayerSourceEventHandlers(baseLayer);

document.querySelector('#error-modal button').addEventListener('click', () => {
    document.querySelector('#error-modal').classList.add('hide');
})