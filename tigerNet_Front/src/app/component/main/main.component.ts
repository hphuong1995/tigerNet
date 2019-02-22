import { Component, OnInit,AfterViewInit } from '@angular/core';
import coseBilkent from 'cytoscape-cose-bilkent';

declare var cytoscape: any;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit,AfterViewInit {
  private cy: any;
  private else:any;
  private i : any;
  constructor() { }

  ngOnInit() {
  }
  ngAfterViewInit() {
   
    this.cy = cytoscape({
      container:  document.getElementById('cy'), // container to render in
      elements :[ // list of graph elements to start with
       { // node a
        data: { id: 'N01',parent:'P01' }
       },
       { // node b
         data: { id: 'N02',parent:'P01' }
       },
       { // node c
         data: { id: 'N03',parent:'P01' }
       },
       { // node d
         data: { id: 'N04',parent:'P02' }
       },
       { // node e
        data: { id: 'N05',parent:'P02' }
      },
      { // node f
        data: { id: 'N06',parent:'P02' }
      },
      { // node g
        data: { id: 'N07',parent:'P03' }
      },
      { // node h
       data: { id: 'N08',parent:'P03' }
     },
     { // node i
       data: { id: 'N09',parent:'P03' }
     },
      { // node nparent
        data: { id: 'P01' }
      },
      { // node nparent
        data: { id: 'P02' }
      },
      { // node nparent
        data: { id: 'P03' }
      },
       { // edge ab
         data: { id: 'ab', source: 'N01', target: 'N02' }
       },
       { // edge ac
         data: { id: 'ac', source: 'N01', target: 'N03' }
       },
       { // edge bc
         data: { id: 'bc', source: 'N02', target: 'N03' }
       },
       { // edge cd
        data: { id: 'cd', source: 'N03', target: 'N04' }
       },
       { // edge ef
         data: { id: 'ef', source: 'N05', target: 'N06' }
       },
       { // edge df
         data: { id: 'df', source: 'N04', target: 'N06' }
       },
       { // edge de
         data: { id: 'de', source: 'N04', target: 'N05' }
       }
       ,
       { // edge gd
         data: { id: 'gd', source: 'N07', target: 'N04' }
       }
       ,
       { // edge gc
         data: { id: 'gc', source: 'N07', target: 'N03' }
       }
       ,
       { // edge gi
         data: { id: 'gi', source: 'N07', target: 'N09' }
       }
       ,
       { // edge gh
         data: { id: 'gh', source: 'N07', target: 'N08' }
       }
       ,
       { // edge hi
         data: { id: 'hi', source: 'N08', target: 'N09' }
       }
     ],
   
     style: [ // the stylesheet for the graph
      
      {
         selector: 'node',
         style: {
           //'background-color': '#1C86EE',
           'label': 'data(id)'
         }
       },
       {
         selector: 'edge',
         style: {
           'width':2,
           'line-color': '#000'
         }
       },
       {
        selector: '#N03,#N04,#N07',
        style: {
          'background-color': '#FFD700'
        }
      },
      {
        selector: '#N01,#N02,#N05,#N06,#N08,#N09',
        style: {
          'background-color': '	#66CD00'
        }
      }
     ],
   
     layout: {
       name: 'cose-bilkent',
       rows: 1
     }
    //  ,
    //  zoom: 3,
    //  pan: { x: 0, y: 0 },
    //  minZoom: 1e-50,
    //  maxZoom: 1e50,
    });

    
    cytoscape.use(coseBilkent);
  }

}
