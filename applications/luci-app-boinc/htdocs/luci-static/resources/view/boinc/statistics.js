'use strict';
'require ui';
'require fs';



const colors = ['rgb(255,0,0)', 'rgb(0,0,255)', 'rgb(0,255,0)', 'rgb(255,128,0)', 
                'rgb(128,255,0)', 'rgb(128,0,255)', 'rgb(255,255,0)', 'rgb(0,255,255)', 
                'rgb(255,0,255)', 'rgb(0,128,255)', 'rgb(191,255,0)', 'rgb(0,255,192)', 
                'rgb(255,0,128)', 'rgb(0,255,128)', 'rgb(64,0,255)', 'rgb(64,255,0)'];
const monthStr=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];



Element.prototype.setAttributes = function (attributes) {
   for(var key in attributes) {
      this.setAttribute(key, attributes[key]);
   }
}



Array.prototype.lastElement = function () {
   return this[this.length-1];
}



function createSVG(width, height, data, key) {
   var svgns = 'http://www.w3.org/2000/svg';
   var yAxisDivs = 5; // can result in +1 divisions

   height = height - 1;

   var svg = document.createElementNS(svgns, 'svg');
   svg.setAttribute('width', width);
   svg.setAttribute('height', height);
   svg.setAttribute('display', 'block');

   // get max number of elements
   var maxElements = 0;
   var idxMaxElements = 0;
   for (var i=0; i<data.length; i++) {
      if (data[i].date.length > maxElements) {
         maxElements = data[i].date.length;
         idxMaxElements = i;
      }
   }

   // get max summed value over all Projects
   var maxValue = 0;
   var sum = new Array(maxElements).fill(0);
   for (var i=0; i<data.length; i++) {
      var offset = maxElements - data[i][key].length;

      for (var j=0; j<data[i][key].length; j++) {
         sum[offset+j] += data[i][key][j];
      }
   }
   for (var i=0; i<maxElements; i++) {
      if (sum[i] > maxValue)
         maxValue = sum[i];
   }

   var pxPerValue = height / maxValue;
   var pxPerElement = width / (maxElements-1);


   // draw the polylines for each Project
   var summedValues = new Array(maxElements).fill(0);
   var colorIdx = 0;
   for (var i=0; i<data.length; i++) {
      var polyline = document.createElementNS(svgns, 'polyline');
      polyline.setAttribute('id', 'poly-'+key+'-'+i);
      polyline.setAttributes({'fill': colors[colorIdx], 'fill-opacity': 0.4});
      polyline.setAttributes({'stroke': colors[colorIdx], 'stroke-width': 1});

      // bottom part
      for (var j=0; j<maxElements; j++) {
         var point = svg.createSVGPoint();
         point.x = j * pxPerElement;
         point.y = height - (summedValues[j] * pxPerValue) + 1;

         polyline.points.appendItem(point);
      }

      // top part
      var offset = maxElements - data[i][key].length;
      for (var j=data[i][key].length; j>=0; j--) {
         summedValues[offset+j] += data[i][key][j];
      }
      for (var j=(maxElements-1); j>=0; j--) {
         var point = svg.createSVGPoint();
         point.x = j * pxPerElement;
         point.y = height - (summedValues[j] * pxPerValue) + 1;

         polyline.points.appendItem(point);
      }
      svg.append(polyline);

      // jump to the next color
      colorIdx++;
      if (colorIdx >= colors.length)
         colorIdx=0;
   }


   // x - axis
   for (var i=0; i<maxElements; i++) {
      var curX = pxPerElement * i;

      var line = document.createElementNS(svgns, 'line');
      line.setAttributes({'x1':curX, 'x2':curX, 'y1':0, 'y2':height});
      line.setAttributes({'stroke':'black', 'stroke-width':0.1});
      svg.append(line);

      var date = new Date(data[idxMaxElements].date[i] * 1000);
      var dateString = monthStr[date.getMonth()] + ' ' + date.getDate();
      var textY = height - 5;
      var text = document.createElementNS(svgns, 'text');
      curX = curX - 5;
      text.setAttributes({'x':curX, 'y':textY, 'transform':'rotate(-90,'+curX+','+textY+')'});
      text.setAttributes({'text-size': '10px', 'fill':'black', 'fill-opacity':0.4});
      text.textContent = dateString;
      svg.append(text);
   }

   // y - axis
   var factor = 1000000000;
   var valuePerDiv = 0;
   do {
      valuePerDiv = Math.floor((maxValue / yAxisDivs) / factor) * factor;
      factor = factor / 10;
   } while (valuePerDiv == 0);

   console.log(valuePerDiv + ', ' + factor);
   for (var i=valuePerDiv; i<maxValue; i+=valuePerDiv) {
      var curY = height - (i * pxPerValue);

      var line = document.createElementNS(svgns, 'line');
      line.setAttributes({'stroke':'black', 'stroke-width':0.1});
      line.setAttributes({'x1':0, 'x2':width, 'y1':curY, 'y2':curY});
      svg.append(line);

      var text = document.createElementNS(svgns, 'text');
      text.setAttributes({'x':5, 'y':curY + 12});
      text.setAttributes({'text-size': '10px', 'font-weight':'bold', 'fill': 'black', 'fill-opacity':0.4});
      text.textContent = i.toLocaleString('en-US');
      svg.append(text);
   }

   // outside border
   var rect = document.createElementNS(svgns, 'rect');
   rect.setAttributes({'x':0, 'y':0, 'width':width, 'height':height});
   rect.setAttributes({'fill':'none', 'stroke':'black', 'stroke-width':1});
   svg.append(rect);

   return svg
}



return L.view.extend({
   load: function() {
      return L.resolveDefault(fs.exec_direct('/usr/bin/boinc-luci', ['get_statistics']));
   },

   render: function(statistics) {
      var statisticsJson = JSON.parse(statistics);
      var viewWidth = (document.getElementById('view')).offsetWidth;

      var mainSection = E('div', {}, [
         E('div', {})
      ]);


      var paneHostAvg = mainSection.firstChild;
      var paneHostTotal = mainSection.firstChild;
      var paneUserAvg = mainSection.firstChild;
      var paneUserTotal = mainSection.firstChild;

      paneHostAvg.appendChild(
         E('div', {'data-tab': 'host-avg-tab', 'data-tab-title': 'Host average', 'data-tab-active': 'true' }, [
            E('div', {'style': 'width: 100%; height: 500px; border: 0'})
         ]));
      paneHostTotal.appendChild(
         E('div', {'data-tab': 'Host-total-tab', 'data-tab-title': 'Host total', 'data-tab-active': 'false'}, [
            E('div', {'id': 'host-total', 'style': 'width: 100%; height: 500px; border: 0'})
         ]));
      paneUserAvg.appendChild(
         E('div', {'data-tab': 'User-avg-tab', 'data-tab-title': 'User average', 'data-tab-active': 'false'}, [
            E('div', {'id': 'user-avg', 'style': 'width: 100%; height: 500px; border: 0'})
         ]));
      paneUserTotal.appendChild(
         E('div', {'data-tab': 'User-total-tab', 'data-tab-title': 'User total', 'data-tab-active': 'false'}, [
            E('div', {'id': 'user-total', 'style': 'width: 100%; height: 500px; border: 0'})
         ]));

      var svgHostAvg = paneHostAvg.childNodes[0].firstChild;
      svgHostAvg.appendChild(createSVG(viewWidth, 500, statisticsJson, 'hostAvg'));

      var svgHostTotal = paneHostTotal.childNodes[1].firstChild;
      svgHostTotal.appendChild(createSVG(viewWidth, 500, statisticsJson, 'hostTotal'));

      var svgUserAvg = paneUserAvg.childNodes[2].firstChild;
      svgUserAvg.appendChild(createSVG(viewWidth, 500, statisticsJson, 'userAvg'));

      var svgUserTotal = paneUserTotal.childNodes[3].firstChild;
      svgUserTotal.appendChild(createSVG(viewWidth, 500, statisticsJson, 'userTotal'));

      ui.tabs.initTabGroup(mainSection.firstChild.childNodes);


      var tblLegend = E('div', {'id': 'tblLegend', 'class': 'table', 'style':'margin-top:1em'}, [
         E('div', { 'class': 'tr table-titles' }, [
            E('div', {'class': 'th'}, _(' ')),
            E('div', {'class': 'th'}, _('Project')),
            E('div', {'class': 'th'}, _('Host avg')),
            E('div', {'class': 'th'}, _('Host total')),
            E('div', {'class': 'th'}, _('User avg')),
            E('div', {'class': 'th'}, _('User total'))
         ])
      ]);

      for (var i=0; i<statisticsJson.length; i++) {
         var row = E('div', {'class': 'tr'}, [
            E('div', {'class': 'td'}, [
               E('span', {'style': 'height: 15px; width: 15px; border-radius:50%; display: inline-block; background-color: '+colors[i]+'; opacity: 0.4'})
            ]),
            E('div', {'class': 'td'}, _( statisticsJson[i].name )),
            E('div', {'class': 'td'}, _( (statisticsJson[i].hostAvg.lastElement()).toLocaleString('en-US') )),
            E('div', {'class': 'td'}, _( (statisticsJson[i].hostTotal.lastElement()).toLocaleString('en-US') )),
            E('div', {'class': 'td'}, _( (statisticsJson[i].userAvg.lastElement()).toLocaleString('en-US') )),
            E('div', {'class': 'td'}, _( (statisticsJson[i].userTotal.lastElement()).toLocaleString('en-US') ))
         ]);

         tblLegend.appendChild(row);
      }


      mainSection.appendChild(tblLegend);


      return  [mainSection];
   },
   handleSaveApply: null,
   handleSave: null,
   handleReset: null
});
