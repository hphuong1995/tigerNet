import { Component, OnInit, AfterViewInit } from '@angular/core';
import coseBilkent from 'cytoscape-cose-bilkent';
import { DataService } from 'src/app/data.service';
import { HttpResponse } from '@angular/common/http';
import { Network } from 'src/app/data/network';
import { Pattern } from 'src/app/data/pattern';
import { Node } from 'src/app/data/node';
import { UserService } from 'src/app/user.service';
import { Connector } from 'src/app/data/connector';
import * as $ from 'jquery';

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
    private network: Network;
    private currentSelectedNode = "hello";


    constructor(private data: DataService) { }
   
   
    ngOnInit() {
      let elements: any[] = [];
      let nonConnectorSelectors = "";
      let inactiveSelectors = "";
      let isConnectorSelectors = "";
      this.data.getNetwork().subscribe((res: HttpResponse<Network>) => {
          if (!res.ok) {
              alert("Error loading the network");
              return;
          }
          // this.network = new Network(res.body.patterns, res.body.patternConnections);
          //this.network = <Network>res.body
          this.network = new Network(res.body.patterns, res.body.patternConnections);
          this.network.patterns.forEach( (pattern: Pattern) => {
              elements.push({
                  data: {
                      id: pattern.id
                  }
              })
              pattern.nodes.forEach(( node: Node) => {
                  elements.push({
                      data: {
                          id: node.id,
                          parent: pattern.id
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
              pattern.connections.forEach(( connection: Connector) => {
                  elements.push({
                      // data: {
                      //     id: "" + connection.node + connection.other,
                      //     source: "" + connection.node,
                      //     target: "" + connection.other
                      // }
                      data: {
                          id: "" + connection.id + connection.targetId,
                          source: "" + connection.id,
                          target: "" + connection.targetId
                      }
                  });
              });
          });
          // this.network.patternConnections.forEach((pConnection: Connector) => {
          //     let pid: string = pConnection.id;
          //     let otherPid: string = pConnection.targetId;
          //     let pattern: Pattern = this.network.getPatternById(pid);
          //     if(!pattern) {
          //         alert( "no connector node found in pattern" );
          //     }
          //     let otherPattern: Pattern = this.network.getPatternById(otherPid);
          //     if(!otherPattern) {
          //         alert( "no connector node found in pattern" );
          //     }
          //     let connectorNode: Node = pattern.getConnectorNode();
          //     if(!connectorNode) {
          //         alert( "no connector node found in pattern" );
          //     }
          //     let otherConnectorNode: Node = otherPattern.getConnectorNode();
          //     if(!otherConnectorNode) {
          //         alert( "no connector node found in pattern" );
          //     }
          //     elements.push({
          //         data: {
          //             id: connectorNode.id + otherConnectorNode.id,
          //             source: connectorNode.id,
          //             target: otherConnectorNode.id
          //         }
          //     })
          // });
          this.network.patternConnections.forEach((pConnection: Connector) => {
              // let pid: string = pConnection.id;
              // let otherPid: string = pConnection.targetId;
              // let pattern: Pattern = this.network.getPatternById(pid);
              // if(!pattern) {
              //     alert( "no connector node found in pattern" );
              // }
              // let otherPattern: Pattern = this.network.getPatternById(otherPid);
              // if(!otherPattern) {
              //     alert( "no connector node found in pattern" );
              // }
              // let connectorNode: Node = pattern.getConnectorNode();
              // if(!connectorNode) {
              //     alert( "no connector node found in pattern" );
              // }
              // let otherConnectorNode: Node = otherPattern.getConnectorNode();
              // if(!otherConnectorNode) {
              //     alert( "no connector node found in pattern" );
              // }
              // elements.push({
              //     data: {
              //         id: connectorNode.id + otherConnectorNode.id,
              //         source: connectorNode.id,
              //         target: otherConnectorNode.id
              //     }
              // });
              elements.push({
                  data: {
                      id: pConnection.id + pConnection.targetId,
                      source: pConnection.id,
                      target: pConnection.targetId
                  }
              });
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
                  },
                  {
                      selector:  ':selected',
                      css :{
                        'background-color' : '#FF4500',
                      }
                  }
              ],

              layout: {
                  name: 'cose-bilkent',
                  rows: 1
              }

          });
          cytoscape.use(coseBilkent);
          //var collector = this.cy.collection();
          //console.log(this);
          var _this = this;

          this.cy.nodes().on('tap', function(e){
            //let clickedNode : string;
            var clickedEle = e.target.id();
            //console.log();
            //collector = collector.union(clickedNode);
            if(clickedEle.charAt(0) === 'P' && ! _this.data.selectedPatterns.includes(clickedEle))
              _this.data.selectedPatterns.push(clickedEle);
            else if(clickedEle.charAt(0) === 'N' && ! _this.data.selectedNodes.includes(clickedEle))
              _this.data.selectedNodes.push(clickedEle);

          });
      });
    }

    ngAfterViewInit(){

    }


    resetSelectedElement = function(){
      this.data.selectedNodes = [];
      this.data.selectedPatterns = [];
    }

    addNode = function(){
      console.log(this.data.selectedNodes);

      // check if a pattern is selected
      if(this.data.selectedPatterns.length !== 1){
        this.resetSelectedElement();
        alert("Please select only 1 Pattern that new node will be added to.");
        return;
      }
      // check if at least 1 node and less than 3 node is selected
      if(this.data.selectedNodes.length === 0 || this.data.selectedNodes.length > 3){
        this.resetSelectedElement();
        alert("Please select at least 1 and at most 3 nodes for this operation.");
        return;
      }
      let currentPattern : Pattern;
      currentPattern = this.network.getPatternById(this.data.selectedPatterns[0]);
      console.log(currentPattern);

      // check if the pattern is full
      if(currentPattern.nodes.length === 7){
        this.resetSelectedElement();
        alert("The pattern is full.");
        return;
      }

      // check if all nodes selected in the selected patterns
      this.data.selectedNodes.forEach( (node : string) =>{
        if(!currentPattern.getNodeById(node)){
          this.resetSelectedElement();
          alert("Please select nodes that inside the selected pattern.");
          return;
        }
      });

      // Check if 3 nodes is selected, the connector node must be in the arr
      if(this.data.selectedNodes.length === 3){
        if(!this.data.selectedNodes.includes(currentPattern.getConnectorNode().id)){
          this.resetSelectedElement();
          alert("When user choose 3 nodes, one of them must be connector node");
          return;
        }
      }

      // If selected pattern has 3 nodes, then must select at least 2 node.
      if(currentPattern.nodes.length >= 3){
        if(this.data.selectedNodes.length < 2){
          this.resetSelectedElement();
          alert("Selected pattern has more than 3 nodes, please select at least 2 nodes to maintain the ring.");
          return;
        }
      }

      var reqObject = { 'pattern' : currentPattern,
                        'nodes' : this.data.selectedNodes};
      this.resetSelectedElement();

      this.data.addNode(reqObject).subscribe( (data) =>{
        console.log(data);
      });
    }


    addPattern = function(){
      if(this.data.selectedNodes.length > 0){
        this.data.selectedNodes = [];
        this.data.selectedPatterns = [];
        alert("Please only select patterns for this operation.");
        return;
      }
      if(this.data.selectedPatterns.length === 0){
        this.data.selectedNodes = [];
        this.data.selectedPatterns = [];
        alert("Please select a pattern that new pattern connect to.");
        return;
      }
      else{
        console.log(this.data.selectedPatterns);
        var arrToSend = this.data.selectedPatterns;
        this.data.selectedNodes = [];
        this.data.selectedPatterns = [];
        this.data.addPattern(arrToSend).subscribe( (data) =>{
          console.log(data);
        });
      }
    }
}
