import { Component, OnInit, AfterViewInit } from '@angular/core';
import coseBilkent from 'cytoscape-cose-bilkent';
import { DataService } from 'src/app/data.service';
import { HttpResponse } from '@angular/common/http';

declare var cytoscape: any;

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, AfterViewInit {
    private cy: any;
    private else: any;
    private i: any;
    private network: any;
    constructor(private data: DataService) { }

    ngOnInit() {
    }
    ngAfterViewInit() {
        let elements: any[] = [];
        let nonConnectorSelectors = "";
        let inactiveSelectors = "";
        let isConnectorSelectors = "";
        this.data.getNetwork().subscribe((res: HttpResponse<Object>) => {
            if (!res.ok) {
                alert("Error loading the network");
                return;
            }
            this.network = res.body;
            this.network.patterns.forEach( (pObj: any) => {
                elements.push({
                    data: {
                        id: pObj.id
                    }
                })
                pObj.pattern.nodes.forEach(( node: any) => {
                    elements.push({
                        data: {
                            id: node.id,
                            parent: pObj.id
                        }
                    });
                    if(node.isActive) {
                        if(node.isConnector) {
                            isConnectorSelectors += "#" + node.id + ",";
                        } else {
                            nonConnectorSelectors += "#" + node.id + ",";
                        }
                    } else {
                        inactiveSelectors += "#" + node.id + ",";
                    }
                });
                pObj.pattern.connections.forEach(( connection: any) => {
                    elements.push({
                        data: {
                            id: "" + connection.node + connection.other,
                            source: "" + connection.node,
                            target: "" + connection.other
                        }
                    });
                });
            });
            this.network.patternConnections.forEach((pConnection: any) => {
                let pid: string = pConnection.pattern;
                let otherPid: string = pConnection.other;
                let patternObj: any = this.network.patterns.find( (pObj: any) => {
                    return pObj.id === pid;
                });
                if(!patternObj) {
                    alert( "no connector node found in pattern" );
                }
                let otherPatternObj: any = this.network.patterns.find( (pObj: any) => {
                    return pObj.id === otherPid;
                });
                if(!otherPatternObj) {
                    alert( "no connector node found in pattern" );
                }
                let connectorNode: any = patternObj.pattern.nodes.find( (n: any ) => n.isConnector );
                if(!connectorNode) {
                    alert( "no connector node found in pattern" );
                }
                let otherConnectorNode: any = otherPatternObj.pattern.nodes.find( (n: any ) => n.isConnector );
                if(!otherConnectorNode) {
                    alert( "no connector node found in pattern" );
                }
                elements.push({
                    data: {
                        id: connectorNode.id + otherConnectorNode.id,
                        source: connectorNode.id,
                        target: otherConnectorNode.id
                    }
                })
            });
            nonConnectorSelectors = nonConnectorSelectors.substr(0, nonConnectorSelectors.length - 1);
            inactiveSelectors = inactiveSelectors.substr(0, inactiveSelectors.length - 1);
            isConnectorSelectors = isConnectorSelectors.substr(0, isConnectorSelectors.length - 1);
            
            this.cy = cytoscape({
                container: document.getElementById('cy'), // container to render in
                elements: elements,
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
                            'width': 2,
                            'line-color': '#000'
                        }
                    },
                    {
                        selector: isConnectorSelectors,
                        style: {
                            'background-color': '#FFD700'
                        }
                    },
                    {
                        selector: nonConnectorSelectors,
                        style: {
                            'background-color': '	#66CD00'
                        }
                    },
                    {
                        selector: inactiveSelectors,
                        style: {
                            'background-color': '	#888888'
                        }
                    }
                ],
    
                layout: {
                    name: 'cose-bilkent',
                    rows: 1
                }

            // style: [ // the stylesheet for the graph

            //             {
            //                 selector: 'node',
            //                 style: {
            //                     //'background-color': '#1C86EE',
            //                     'label': 'data(id)'
            //                 }
            //             },
            //             {
            //                 selector: 'edge',
            //                 style: {
            //                     'width': 2,
            //                     'line-color': '#000'
            //                 }
            //             },
            //             {
            //                 selector: '#N03,#N04,#N07',
            //                 style: {
            //                     'background-color': '#FFD700'
            //                 }
            //             },
            //             {
            //                 selector: '#N01,#N02,#N05,#N06,#N08,#N09',
            //                 style: {
            //                     'background-color': '	#66CD00'
            //                 }
            //             }
            //         ],
        
            //         layout: {
            //             name: 'cose-bilkent',
            //             rows: 1
            //         }
            });            
            cytoscape.use(coseBilkent);
        });
        

        // this.cy = cytoscape({
        //     container: document.getElementById('cy'), // container to render in
        //     elements: [ // list of graph elements to start with
        //         { // node a
        //             data: { id: 'N01', parent: 'P01' }
        //         },
        //         { // node b
        //             data: { id: 'N02', parent: 'P01' }
        //         },
        //         { // node c
        //             data: { id: 'N03', parent: 'P01' }
        //         },
        //         { // node d
        //             data: { id: 'N04', parent: 'P02' }
        //         },
        //         { // node e
        //             data: { id: 'N05', parent: 'P02' }
        //         },
        //         { // node f
        //             data: { id: 'N06', parent: 'P02' }
        //         },
        //         { // node g
        //             data: { id: 'N07', parent: 'P03' }
        //         },
        //         { // node h
        //             data: { id: 'N08', parent: 'P03' }
        //         },
        //         { // node i
        //             data: { id: 'N09', parent: 'P03' }
        //         },
        //         { // node nparent
        //             data: { id: 'P01' }
        //         },
        //         { // node nparent
        //             data: { id: 'P02' }
        //         },
        //         { // node nparent
        //             data: { id: 'P03' }
        //         },
        //         { // edge ab
        //             data: { id: 'ab', source: 'N01', target: 'N02' }
        //         },
        //         { // edge ac
        //             data: { id: 'ac', source: 'N01', target: 'N03' }
        //         },
        //         { // edge bc
        //             data: { id: 'bc', source: 'N02', target: 'N03' }
        //         },
        //         { // edge cd
        //             data: { id: 'cd', source: 'N03', target: 'N04' }
        //         },
        //         { // edge ef
        //             data: { id: 'ef', source: 'N05', target: 'N06' }
        //         },
        //         { // edge df
        //             data: { id: 'df', source: 'N04', target: 'N06' }
        //         },
        //         { // edge de
        //             data: { id: 'de', source: 'N04', target: 'N05' }
        //         }
        //         ,
        //         { // edge gd
        //             data: { id: 'gd', source: 'N07', target: 'N04' }
        //         }
        //         ,
        //         { // edge gc
        //             data: { id: 'gc', source: 'N07', target: 'N03' }
        //         }
        //         ,
        //         { // edge gi
        //             data: { id: 'gi', source: 'N07', target: 'N09' }
        //         }
        //         ,
        //         { // edge gh
        //             data: { id: 'gh', source: 'N07', target: 'N08' }
        //         }
        //         ,
        //         { // edge hi
        //             data: { id: 'hi', source: 'N08', target: 'N09' }
        //         }
        //     ],

        //     style: [ // the stylesheet for the graph

        //         {
        //             selector: 'node',
        //             style: {
        //                 //'background-color': '#1C86EE',
        //                 'label': 'data(id)'
        //             }
        //         },
        //         {
        //             selector: 'edge',
        //             style: {
        //                 'width': 2,
        //                 'line-color': '#000'
        //             }
        //         },
        //         {
        //             selector: '#N03,#N04,#N07',
        //             style: {
        //                 'background-color': '#FFD700'
        //             }
        //         },
        //         {
        //             selector: '#N01,#N02,#N05,#N06,#N08,#N09',
        //             style: {
        //                 'background-color': '	#66CD00'
        //             }
        //         }
        //     ],

        //     layout: {
        //         name: 'cose-bilkent',
        //         rows: 1
        //     }
        //     //    ,
        //     //    zoom: 3,
        //     //    pan: { x: 0, y: 0 },
        //     //    minZoom: 1e-50,
        //     //    maxZoom: 1e50,
        // });


    }

}
