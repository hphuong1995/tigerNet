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

      this.data.getNetwork().subscribe((res: HttpResponse<Network>) => {
          if (!res.ok) {
              alert("Error loading the network");
              return;
          }
          this.resetGraph(res.body.patterns, res.body.patternConnections);
      });
    }

    ngAfterViewInit(){

    }


    resetSelectedElement = function(){
      // this.data.selectedNodes.forEach( (selectedNode) =>{
      //   this.cy.$('#'+selectedNode).json({ selected: false });
      // });
      // this.data.selectedPatterns.forEach( (selectedPattern) =>{
      //   this.cy.$('#'+selectedPattern).json({ selected: false });
      // });
      this.data.selectedNodes.forEach( (selectedNode) =>{
        this.cy.$('#'+selectedNode).removeClass('highlighted');
      });
      this.data.selectedPatterns.forEach( (selectedPattern) =>{
        this.cy.$('#'+selectedPattern).removeClass('highlighted');
      });
      this.data.selectedLink.forEach( (selectedLink) =>{
        this.cy.$('#'+selectedLink).json({ selected: false });
      });

      this.data.selectedLink = [];
      this.data.selectedNodes = [];
      this.data.selectedPatterns = [];
    }

    addNode = function(){
      console.log(this.data.selectedNodes);

      // check if a pattern is selected
      if(this.data.selectedPatterns.length !== 0){
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
      currentPattern = this.network.getPatternByChildNodeId(this.data.selectedNodes[0]);
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
          alert("Please select nodes that inside the only 1 patern pattern.");
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
      if(currentPattern.nodes.length >= 2){
        if(this.data.selectedNodes.length < 2){
          this.resetSelectedElement();
          console.log("hit");
          alert("Selected pattern has more than 3 nodes, please select at least 2 nodes to maintain the ring.");
          return;
        }
      }

      var reqObject = { 'pattern' : currentPattern.id,
                        'nodes' : this.data.selectedNodes,
                        'conNode' : currentPattern.getConnectorNode().id,
                        'currentNodeNum' : currentPattern.nodes.length};
      this.resetSelectedElement();

      this.data.addNode(reqObject).subscribe( (data) =>{
        console.log(data);
        this.resetGraph(data.patterns, data.patternConnections);
      });
    }

    addConnection = function(){
      if(this.data.selectedPatterns.length !== 2 && this.data.selectedNodes.length !== 2 ){
        this.resetSelectedElement();
        alert("Please select 2 nodes or 2 patterns to add a link");
        return;
      }
      else{
        if(this.data.selectedPatterns.length === 2){
          if(this.data.selectedNodes.length !== 0){
            this.resetSelectedElement();
            alert("Please select 2 nodes OR 2 patterns to add a link, not both");
            return;
          }
          else{
            // Adding link between 2 connector nodes
            var arrToSend = [];

            this.data.selectedPatterns.forEach( (pat) =>{
              //console.log(this.network.getPatternById(pat).getConnectorNode().id);
              arrToSend.push(this.network.getPatternById(pat).getConnectorNode().id);
            });
            this.resetSelectedElement();
            if(this.checkConnectionExist(arrToSend,  this.network.patternConnections)){
              alert("The connection between selected Pattern is already exist.");
              return;
            }else{
              this.data.addNewConnection(arrToSend).subscribe( (data) =>{
                console.log(data);
                this.resetGraph(data.patterns, data.patternConnections);
              });
            }
          }
        }
        else if(this.data.selectedNodes.length === 2){
          if(this.data.selectedPatterns.length !== 0){
            this.resetSelectedElement();
            alert("Please select 2 nodes or 2 patterns to add a link, not both");
            return;
          }
          else{
            // check if selected Node is in the same pattern
            if(this.network.getPatternByChildNodeId(this.data.selectedNodes[0]).id
                !== this.network.getPatternByChildNodeId(this.data.selectedNodes[1]).id){
                  this.resetSelectedElement();
                  alert("Please select 2 nodes in the same pattern.");
                  return;
            }
            else{
              //console.log(this.network.getPatternByChildNodeId(this.data.selectedNodes[0]));
              //console.log(this.data.selectedNodes[0]));
              if(this.checkConnectionExist(this.data.selectedNodes, this.network.getPatternByChildNodeId(this.data.selectedNodes[0]).connections)){
                this.resetSelectedElement();
                alert("The connection is already exist");
                return;
              }
              else{
                this.data.addNewConnection(this.data.selectedNodes).subscribe( (data) =>{
                  console.log(data);
                  this.resetGraph(data.patterns, data.patternConnections);
                  this.resetSelectedElement();
                });
              }
            }
          }
        }
      }
    }

    deleteConnetion(){
      if(this.data.selectedPatterns.length !== 0 && this.data.selectedNodes.length !== 0 ){
        this.resetSelectedElement();
        alert("Please select only the connection to delete.");
        return;
      }
      var arrToSend : any[] = [];
      arrToSend.push(this.data.selectedLink[0]);
      arrToSend.push(this.data.selectedLink[1]);
      console.log(arrToSend);
      // Delete Pattern connection
      if(this.network.getPatternByChildNodeId(arrToSend[0]).id
          !== this.network.getPatternByChildNodeId(arrToSend[1]).id){
            // check isolate
            this.data.deleteConnection(arrToSend).subscribe (data =>{
              var retData : any = data;
              this.resetGraph(retData.patterns, retData.patternConnections);
              this.checkPatternIsolate(this.network);
            });
      }
      else{  // delete connection in the Pattern

      }

    }



    addPattern = function(){
      if(this.data.selectedNodes.length > 0){
        this.resetSelectedElement();
        alert("Please only select patterns for this operation.");
        return;
      }
      if(this.data.selectedPatterns.length === 0){
        this.resetSelectedElement();
        alert("Please select a pattern that new pattern connect to.");
        return;
      }
      else{
        var arrToSend = [];
        //console.log(this.data.selectedPatterns);
        this.data.selectedPatterns.forEach( (pid) =>{
          arrToSend.push(this.network.getPatternById(pid).getConnectorNode().id);
        });
        console.log(arrToSend);
        this.resetSelectedElement();
        this.data.addPattern(arrToSend).subscribe( (data) =>{
          console.log(data);
          this.resetGraph(data.patterns, data.patternConnections);
        });
      }
    }

    checkConnectionExist(arrToSend : any[], arrayToCheck : any[]){
      var flag : boolean = false;

      arrayToCheck.forEach( (connector) =>{
        if(connector.id === arrToSend[0] && connector.targetId === arrToSend[1] ){
          flag = true;
        }
        else if(connector.id === arrToSend[1] && connector.targetId === arrToSend[0]){
          flag = true;
        }
        else{
          // skip
        }
      });
      return flag;
    }

    deleteNode(){
      if(this.data.selectedLink.length !== 0 || this.data.selectedPatterns.length !== 0){
        this.resetSelectedElement();
        alert("Please select a node to delete");
        return;
      }
      if(this.data.selectedNodes.length !== 1){
        this.resetSelectedElement();
        alert("Please only one node to delete");
        return;
      }
      this.checkPatternIsolate(this.network);
      var selectedNodeId = this.data.selectedNodes[0];
      var pattern = this.network.getPatternByChildNodeId(selectedNodeId);
      var nodesNumber = pattern.nodes.length;

      if(nodesNumber === 1 && selectedNodeId !== pattern.getConnectorNode().id){
        this.resetSelectedElement();
        alert("You can only delete connector node if it is the last node in the pattern");
        return;
      }

      console.log(pattern);
    }

    checkValidNetwork(network : Network){

    }



    checkPatternIsolate(network : Network){
      var connectorNodeQueue : string[] = [];
      var readList : string[] = [];

      connectorNodeQueue.push(network.patterns[0].getConnectorNode().id);

      while( connectorNodeQueue.length != readList.length){
        var currentNode : string;
        var i;
        // Find a pattern that havent read
        for (i = 0; i < connectorNodeQueue.length; i++){
          if(!readList.includes(connectorNodeQueue[i])){
            currentNode = connectorNodeQueue[i];
            readList.push(currentNode);
            break;
          }
        }

        network.patternConnections.forEach( (connection : Connector) =>{
          if(connection.id === currentNode && !connectorNodeQueue.includes(connection.targetId)){
            connectorNodeQueue.push(connection.targetId);
          }

          if(connection.targetId === currentNode && !connectorNodeQueue.includes(connection.id)){
            connectorNodeQueue.push(connection.id);
          }
        });

      }

      if(connectorNodeQueue.length === network.patterns.length){
        console.log("valid " + connectorNodeQueue);
        return true;
      }
      else{
        console.log("invalid " + connectorNodeQueue);
        return false;
      }

    }

    resetGraph( patterns, connections){
      let elements: any[] = [];
      let nonConnectorSelectors = "";
      let inactiveSelectors = "";
      let isConnectorSelectors = "";

      this.network = new Network(patterns, connections);
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
      this.network.patternConnections.forEach((pConnection: Connector) => {
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
                  selector:  '.highlighted',
                  css :{
                    'background-color' : '#FF4500',
                    'line-color' : '#FF4500'
                  }
              },
              {
                selector:  '.patternHighlighted',
                css :{
                  'background-color' : '#B03060'
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
      //this.cy.$('#' + clickedEle).addClass('test');


      this.cy.nodes().on('tap', function(e){
        //let clickedNode : string;
        var clickedEle = e.target.id();
        e.preventDefault();
        e.stopPropagation();
        //collector = collector.union(clickedNode);
        if(clickedEle.charAt(0) === 'P') {//pattern

          if(_this.data.selectedPatterns.includes(clickedEle)) {//pattern is selected, deselect it
            _this.data.selectedPatterns = _this.data.selectedPatterns.filter( x => x !== clickedEle);
            e.target.removeClass('patternHighlighted');
          } else {//pattern is not selected, select it
            _this.data.selectedPatterns.push(clickedEle);
            e.target.addClass('patternHighlighted');
          }

        } else{//node

          if(_this.data.selectedNodes.includes(clickedEle)) {//node is selected, deselect it
            _this.data.selectedNodes = _this.data.selectedNodes.filter( x => x !== clickedEle);
            e.target.removeClass('highlighted');
          } else {//node is not selected, select it
            _this.data.selectedNodes.push(clickedEle);
            e.target.addClass('highlighted');
          }

        }
        // if(clickedEle.charAt(0) === 'P' && ! _this.data.selectedPatterns.includes(clickedEle)) {
        //   _this.data.selectedPatterns.push(clickedEle);
        // } else if(clickedEle.charAt(0) === 'N' && ! _this.data.selectedNodes.includes(clickedEle)) {
        //   _this.data.selectedNodes.push(clickedEle);
        // }
      });

      this.cy.edges().on('tap', function(e){
        //let clickedNode : string;
        var clickedEle = e.target.id();
        e.preventDefault();
        e.stopPropagation();
        //collector = collector.union(clickedNode);
          if(_this.data.selectedLink.includes(clickedEle)) {//pattern is selected, deselect it
            _this.data.selectedLink = _this.data.selectedLink.filter( x => x !== clickedEle);
            e.target.removeClass('highlighted');
          } else {//pattern is not selected, select it
            _this.data.selectedLink.push(clickedEle);
            e.target.addClass('highlighted');
          }
      });

      this.cy.on('tap','edge', function(e){
        //let clickedNode : string;
        //console.log(_this.network.patternConnections);
        var clickedEle = e.target.id();
        _this.data.selectedLink.push(clickedEle.substring(0,3));
        _this.data.selectedLink.push(clickedEle.substring(3,6));
      });
    }
}
