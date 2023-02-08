window.app = {};
var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
var clickedCoordinate, populationLayer, gPopulation;
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var layerYellow = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,1)',
    width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,255,0,0.3)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'point',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'http://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true,
    attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
  }),
  opacity: 0.3
});

var playgroundsStyle = function (f) {
  var p = f.getProperties();
  return new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: 15,
      points: 3,
      fill: new ol.style.Fill({
        color: 'rgba(236, 120, 62, 1)'
      }),
      stroke: new ol.style.Stroke({
        color: '#00f',
        width: 2
      })
    }),
    text: new ol.style.Text({
      font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
      placement: 'point',
      textAlign: 'left',
      textBaseline: 'bottom',
      fill: new ol.style.Fill({
        color: 'rgba(255, 0, 255, 1)'
      }),
      text: p.name
    })
  });
}

var transStyle = function (f) {
  var p = f.getProperties(), color;
  if (p.type === 'point') {
    return new ol.style.Style({
      image: new ol.style.RegularShape({
        radius: 7,
        points: 6,
        fill: new ol.style.Fill({
          color: '#48c7c7'
        }),
        stroke: new ol.style.Stroke({
          color: '#00f',
          width: 2
        })
      }),
      text: new ol.style.Text({
        font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
        placement: 'point',
        textAlign: 'left',
        textBaseline: 'bottom',
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 255, 0.5)'
        }),
        text: p.id + ' ' + p.name
      })
    });
  } else {
    switch (p.id) {
      case 'C':
        color = 'rgba(129, 190, 60, 0.7)';
        break;
      case 'R':
        color = 'rgba(224, 0, 65, 0.7)';
        break;
      case 'O':
        color = 'rgba(245, 155, 15, 0.7)';
        break;
    }
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    });
  }
}

var trans = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'json/trans.json',
    format: new ol.format.GeoJSON()
  }),
  style: transStyle
});

var playgrounds = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'json/playgrounds.json',
    format: new ol.format.GeoJSON()
  }),
  style: playgroundsStyle
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.301994, 22.631393]),
  zoom: 13
});

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});

var map = new ol.Map({
  layers: [baseLayer, trans, playgrounds],
  target: 'map',
  view: appView
});
map.addControl(sidebar);

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');

map.on('singleclick', function (evt) {
  content.innerHTML = '';
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (false === pointClicked) {
      var p = feature.getProperties();
      if (p.type && p.type === 'playground') {
        var lonLat = ol.proj.toLonLat(p.geometry.getCoordinates());
        var message = '<table class="table table-dark">';
        message += '<tbody>';
        message += '<tr><th scope="row" style="width: 80px;">名稱</th><td>' + p.name + '</td></tr>';
        message += '<tr><th scope="row">介紹</th><td><a href="https://pwbmo.kcg.gov.tw/InclusivePlaygroundDetail.aspx?Cond=' + p.id + '" target="_blank" class="btn btn-primary btn-lg btn-block">高雄市政府介紹</a></td></tr>';
        message += '<tr><td colspan="2">';
        message += '<hr /><div class="btn-group-vertical" role="group" style="width: 100%;">';
        message += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + lonLat[1] + ',' + lonLat[0] + '&travelmode=driving" target="_blank" class="btn btn-info btn-lg btn-block">Google 導航</a>';
        message += '<a href="https://wego.here.com/directions/drive/mylocation/' + lonLat[1] + ',' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Here WeGo 導航</a>';
        message += '<a href="https://bing.com/maps/default.aspx?rtp=~pos.' + lonLat[1] + '_' + lonLat[0] + '" target="_blank" class="btn btn-info btn-lg btn-block">Bing 導航</a>';
        message += '</div></td></tr>';
        message += '</tbody></table>';
        sidebarTitle.innerHTML = p.name;
        content.innerHTML = message;
        sidebar.open('home');
        pointClicked = true;
      }
    }
  });
});