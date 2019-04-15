import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import coseBilkent from 'cytoscape-cose-bilkent';
import { DataService } from 'src/app/data.service';
import { HttpResponse } from '@angular/common/http';
import { Network } from 'src/app/data/network';
import { Domain } from 'src/app/data/domain';
import { Pattern } from 'src/app/data/pattern';
import { Node } from 'src/app/data/node';
import { UserService } from 'src/app/user.service';
import { Connector } from 'src/app/data/connector';
import * as $ from 'jquery';
import { resetCompiledComponents } from '@angular/core/src/render3/jit/module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


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
  private oldNetwork: Network;
  private timerId: number;

  private sendMess : FormGroup;
  private magicNumber = 1;

  private magicChance = 20;

  private currentNode : string;

  private currentNodeMessages: any[];


  constructor(private data: DataService, private user: UserService, private formBuilder: FormBuilder) { }


  ngOnInit() {

    this.sendMess = this.formBuilder.group({
        message: ['']
    });

    this.data.getNetwork().subscribe((res: HttpResponse<Network>) => {
      if (!res.ok) {
        alert("Error loading the network");
        return;
      }
      //this.resetGraph(res.body.patterns, res.body.patternConnections);
      this.resetGraph(res.body.domains, res.body.domainConnections);
    });
  }

  ngAfterViewInit() {
    var _this = this;
    this.timerId = window.setInterval(this.autoDeactivate.bind(this), 1000);
  }

  ngOnDestroy() {
    console.log("Component Destroyed");
    window.clearInterval(this.timerId);
  }

  get f() { return this.sendMess.controls; }

  deleteMess( messageId :string, nid : string){
    this.data.deleteMess(messageId, nid).subscribe(data =>{
      let retData : any = data;
      this.currentNodeMessages = retData;
    });
  }

  async sendMessage(){
    if (this.data.selectedPatterns.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select 2 node for this operation.");
      return;
    }

    if (this.data.selectedNodes.length !== 2 ) {
      this.resetSelectedElement();
      alert("Please only select exactly 2 node for this operation.");
      return;
    }

    if(this.data.selectedNodes[0].charAt(0) === 'D' || this.data.selectedNodes[1].charAt(0) === 'D'){
      this.resetSelectedElement();
      alert("Domain node can not participate in this operation");
      return;
    }

    console.log(this.data.selectedNodes);

    let reqObj :any = {sender : this.data.selectedNodes[0],
                        receiver: this.data.selectedNodes[1],
                        message : this.f.message.value};
    let route: string[]=this.network.getPath(reqObj.sender,reqObj.receiver).map( (n: Node) => {
      return '#' + n.id;
    }).reverse();
    for(let node of route){
      this.cy.$(node).addClass('path');
      //this.jAni.play();
      await this.sleep(1000);
    }


    this.data.sendMessage(reqObj).subscribe( data =>{
      console.log(data);
      this.f.message.setValue("");
      alert("message sent successfully.");
      this.resetSelectedElement();
    });
   

  }

  sleep(ms:number){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }
  viewNode(){
    if (this.data.selectedPatterns.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select node for this operation.");
      return;
    }

    if (this.data.selectedNodes.length !== 1 ){
      this.resetSelectedElement();
      alert("Please only select a node for this operation.");
      return;
    }

    this.data.viewNode(this.data.selectedNodes[0]).subscribe( data =>{
      let retData : any = data;
      this.currentNodeMessages = retData;
      this.resetSelectedElement();
      console.log(data);
    });
  }

  autoDeactivate(_this : any){
    if(!this.network.domains || this.network.domains.length < 1) {
      return;
    }
    let randomNumber = Math.floor(Math.random() * this.magicChance);
    if(randomNumber === this.magicNumber){
      let randomDomain = Math.floor(Math.random() * this.network.domains.length);
      let randomPattern = Math.floor(Math.random() * this.network.domains[randomDomain].patterns.length);
      let randomNode = Math.floor((Math.random() * (this.network.domains[randomDomain].patterns[randomPattern].nodes.length + 1)) - 1);
      let selectedNode: string = "";
      if(randomNode > -1) {
        selectedNode = this.network.domains[randomDomain].patterns[randomPattern].nodes[randomNode].id;
      } else {
        selectedNode = this.network.domains[randomDomain].domainNode.id;
      }


      console.log(selectedNode);
      this.data.activeNode(selectedNode, false).subscribe(data =>{
        // this.network.getPatternByChildNodeId(selectedNode).getNodeById(selectedNode).isActive = false;
        this.network.getNodeById(selectedNode).isActive = false;
        this.cy.$('#' + selectedNode).addClass('inactiveSelectors');
      });
    }
  }

  activeNode(){
    if (this.data.selectedPatterns.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select node for this operation.");
      return;
    }

    let selectedNode = this.data.selectedNodes[0];
    this.cy.$('#' + selectedNode).removeClass('inactiveSelectors');

    this.data.activeNode(this.data.selectedNodes[0], true).subscribe( data =>{
      this.resetSelectedElement();
    });
  }


  resetSelectedElement = function () {
    // this.data.selectedNodes.forEach( (selectedNode) =>{
    //   this.cy.$('#'+selectedNode).json({ selected: false });
    // });
    // this.data.selectedPatterns.forEach( (selectedPattern) =>{
    //   this.cy.$('#'+selectedPattern).json({ selected: false });
    // });
    this.data.selectedNodes.forEach((selectedNode: string) => {
      this.cy.$('#' + selectedNode).removeClass('highlighted');
    });
    this.data.selectedPatterns.forEach((selectedPattern: string) => {
      this.cy.$('#' + selectedPattern).removeClass('highlighted');
    });
    this.data.selectedLink.forEach((selectedLink: string) => {
      this.cy.$('#' + selectedLink).json({ selected: false });
    });
    this.data.selectedDomains.forEach((selectedDomain: string) => {
      this.cy.$('#' + selectedDomain).json({ selected: false });
    });

    this.data.selectedLink = [];
    this.data.selectedNodes = [];
    this.data.selectedPatterns = [];
    this.data.selectedDomains = [];
  }

  addNode = function () {
    //console.log(this.data.selectedNodes);

    if (!this.user.isAdmAccount()) {
      alert("Only administrators can modify the network");
      return;
    }

    // check if a pattern is selected
    if (this.data.selectedPatterns.length !== 0) {
      this.resetSelectedElement();
      alert("Please select only 1 Pattern that new node will be added to.");
      return;
    }
    // check if at least 1 node and less than 3 node is selected
    if (this.data.selectedNodes.length === 0 || this.data.selectedNodes.length > 3) {
      this.resetSelectedElement();
      alert("Please select at least 1 and at most 3 nodes for this operation.");
      return;
    }
    let currentPattern: Pattern;
    currentPattern = this.network.getPatternByChildNodeId(this.data.selectedNodes[0]);
    let currentDomain = this.network.getDomainByChildNodeId(this.data.selectedNodes[0]);
    //console.log(currentPattern);
    console.log(currentDomain.id);
    // check if the pattern is full
    if (currentPattern.nodes.length === 7) {
      this.resetSelectedElement();
      let reqData = {
        pid: [currentPattern.getConnectorNode().id],
        did: currentDomain.id,
        dnid: currentDomain.domainNode.id
      };
      this.data.addPattern(reqData).subscribe((data) => {
        var retData: any = data;
        this.resetGraph(retData.domains, retData.domainConnections);
      });
    }
    else {
      // check if all nodes selected in the selected patterns
      this.data.selectedNodes.forEach((node: string) => {
        if (!currentPattern.getNodeById(node)) {
          this.resetSelectedElement();
          alert("Please select nodes that inside the only 1 patern pattern.");
          return;
        }
      });

      // Check if 3 nodes is selected, the connector node must be in the arr
      if (this.data.selectedNodes.length === 3) {
        if (!this.data.selectedNodes.includes(currentPattern.getConnectorNode().id)) {
          this.resetSelectedElement();
          alert("When user choose 3 nodes, one of them must be connector node");
          return;
        }
      }

      // If selected pattern has 3 nodes, then must select at least 2 node.
      if (currentPattern.nodes.length >= 2) {
        if (this.data.selectedNodes.length < 2) {
          this.resetSelectedElement();
          console.log("hit");
          alert("Selected pattern has more than 3 nodes, please select at least 2 nodes to maintain the ring.");
          return;
        }

        var flag: boolean = true;

        var nonNodes: string[] = [];

        this.data.selectedNodes.forEach(node => {
          if (node.id !== currentPattern.getConnectorNode().id) {
            nonNodes.push(node);
          }
        });

        currentPattern.connections.forEach(con => {
          if (con.id === nonNodes[0] && con.targetId === nonNodes[1])
            flag = false;
          if (con.id === nonNodes[1] && con.targetId === nonNodes[0])
            flag = false;
        });

        if (flag) {
          this.resetSelectedElement();
          alert("You can not add a connection there.");
          return;
        }
      }

      var reqObject = {
        pattern: currentPattern.id,
        nodes: this.data.selectedNodes,
        conNode: currentPattern.getConnectorNode().id,
        currentNodeNum: currentPattern.nodes.length
      };
      this.resetSelectedElement();

      this.oldNetwork = this.network;
      // this.network = new Network(this.oldNetwork.patterns, this.oldNetwork.patternConnections);
      this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
      let pattern: Pattern = this.network.getPatternById(reqObject.pattern);
      const connectorList: Connector[] = [];

      pattern.nodes.push(new Node(true, false, "NXX"));

      reqObject.nodes.forEach((nid: string) => {
        const newConnector = new Connector("NXX", nid);
        pattern.connections.push(newConnector);
      });

      const nonConNodes: string[] = [];
      reqObject.nodes.forEach((nid: string) => {
        if (nid !== reqObject.conNode) {
          nonConNodes.push(nid);
        }
      });
      if (nonConNodes.length !== 2 || reqObject.currentNodeNum === 3) {
        if (!this.network.isValid()) {
          this.resetSelectedElement();
          this.network = this.oldNetwork;
          return;
        }
      } else {
        pattern.connections = pattern.connections.filter((conn: Connector) => {
          return !Connector.compare(conn, new Connector(nonConNodes[0], nonConNodes[1]));
        });
        if (!this.network.isValid()) {
          this.resetSelectedElement();
          this.network = this.oldNetwork;
          return;
        }
      }

      this.data.addNode(reqObject).subscribe((res: HttpResponse<Network>) => {
        if (!res.ok) {
          alert(res.body);
        } else {
          console.log(res.body);
          //this.resetGraph(res.body.patterns, res.body.patternConnections);
          this.resetGraph(res.body.domains, res.body.domainConnections);
        }
      });
    }
  }

  addConnection = function () {
    if (this.data.selectedPatterns.length !== 2 && this.data.selectedNodes.length !== 2 && this.data.selectedDomains.length !== 2) {
      this.resetSelectedElement();
      alert("Please select 2 nodes or 2 patterns or 2 domains to add a link");
      return;
    }
    else {
      if (this.data.selectedPatterns.length === 2) {
        if (this.data.selectedNodes.length !== 0 || this.data.selectedDomains.length !== 0) {
          this.resetSelectedElement();
          alert("Please select 2 nodes or 2 patterns or 2 domains to add a link, not both");
          return;
        }
        else {
          // Adding link between 2 connector nodes
          var arrToSend = [];

          this.data.selectedPatterns.forEach( (pat) => {
            //console.log(this.network.getPatternById(pat).getConnectorNode().id);
            arrToSend.push(this.network.getPatternById(pat).getConnectorNode().id);
          });

          var conList = this.network.getDomainByChildNodeId(arrToSend[0]).getAllConnections();

          this.resetSelectedElement();

          if (this.checkConnectionExist(arrToSend, conList)) {
            alert("The connection between selected Pattern is already exist.");
            return;
          } else {
            this.data.addNewConnection(arrToSend).subscribe((data) => {
              console.log(data);
              // this.resetGraph(data.patterns, data.patternConnections);
              this.resetGraph(data.domains, data.domainConnections);
            });
          }
        }
      }
      else if (this.data.selectedDomains.length === 2) {
        if (this.data.selectedPatterns.length !== 0 || this.data.selectedNodes.length !== 0) {
          this.resetSelectedElement();
          alert("Please select 2 nodes or 2 patterns or 2 domains to add a link, not both");
          return;
        }

        // Adding link between 2 connector nodes
        var arrToSend = [];

        this.data.selectedDomains.forEach( (dom) => {
          //console.log(this.network.getPatternById(pat).getConnectorNode().id);
          arrToSend.push(this.network.getDomainById(dom).domainNode.id);
        });
        this.resetSelectedElement();
        if (this.checkConnectionExist(arrToSend, this.network.domainConnections)) {
          alert("The connection between selected Domain is already exist.");
          return;
        } else {
          this.data.addNewConnection(arrToSend).subscribe((data) => {
            console.log(data);
            // this.resetGraph(data.patterns, data.patternConnections);
            this.resetGraph(data.domains, data.domainConnections);
          });
        }

      }
      else if (this.data.selectedNodes.length === 2) {
        if (this.data.selectedPatterns.length !== 0 || this.data.selectedDomains.length !== 0 ) {
          this.resetSelectedElement();
          alert("Please select 2 nodes or 2 patterns or 2 domains to add a link, not both");
          return;
        }

        // check if selected Node is in the same pattern
        let p, other: Pattern;
        p = this.network.getPatternByChildNodeId(this.data.selectedNodes[0]);
        other = this.network.getPatternByChildNodeId(this.data.selectedNodes[1]);
        if (!p || !other) {
          alert("Please select 2 nodes within the same pattern");
          return;
        }
        if (p.id !== other.id) {
          this.resetSelectedElement();
          alert("Please select 2 nodes in the same pattern.");
          return;
        }

        if (this.checkConnectionExist(this.data.selectedNodes, this.network.getPatternByChildNodeId(this.data.selectedNodes[0]).connections)) {
          this.resetSelectedElement();
          alert("The connection is already exist");
          return;
        }

        var connectorNodeId = this.network.getPatternByChildNodeId(this.data.selectedNodes[0]).getConnectorNode().id;
        if (!this.data.selectedNodes.includes(connectorNodeId)) {
          this.resetSelectedElement();
          alert("User only can add connection between connector and non-connector node within the pattern.");
          return;
        }

        var count = 0;
        this.network.getPatternByChildNodeId(connectorNodeId).connections.forEach(con => {
          if (con.id === connectorNodeId || con.targetId === connectorNodeId)
            count++;
        });

        if (count >= 3) {
          this.resetSelectedElement();
          alert("Connector node only can connect to maximum of 3 non-connector node");
          return;
        }

        this.data.addNewConnection(this.data.selectedNodes).subscribe((data) => {
          console.log(data);
          this.resetGraph(data.domains, data.domainConnections);
          this.resetSelectedElement();
        });
      }
    }
  }

  deleteConnetion() {
    console.log(this.data.selectedLink);
    if (this.data.selectedPatterns.length !== 0 || this.data.selectedNodes.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please select only the connection to delete.");
      return;
    }
    if(this.data.selectedLink.length != 1) {
      alert("Please select one connection to delete.");
      return;
    }
    var arrToSend: any[] = [];
    console.log(this.data.selectedLink);
    arrToSend.push(this.data.selectedLink[0].substr(0, 3));
    arrToSend.push(this.data.selectedLink[0].substr(3, 5));
    console.log(arrToSend);
    if(arrToSend[0].charAt(0) === 'D' && arrToSend[1].charAt(0) === 'D'){

    }
    else if (arrToSend[0].charAt(0) === 'D' || arrToSend[1].charAt(0) === 'D') {
      this.resetSelectedElement();
      alert("User can not delete the connection that assosiates with domain node.");
      return;
    }
    // Delete Pattern connection
    if (this.network.getPatternByChildNodeId(arrToSend[0]).id
      !== this.network.getPatternByChildNodeId(arrToSend[1]).id) {
      // check isolate
      this.resetSelectedElement();
      this.data.deleteConnection(arrToSend).subscribe(data => {
        var retData: any = data;
        this.resetGraph(retData.domains, retData.domainConnections);
      });
    }
    else {  // delete connection in the Pattern
      let currentPat = this.network.getPatternByChildNodeId(arrToSend[0]);

      if (arrToSend[0] !== currentPat.getConnectorNode().id && arrToSend[1] !== currentPat.getConnectorNode().id) {
        this.resetSelectedElement();
        alert("You can only delete connection from connector Node to non-connector Node");
        return;
      }
      else {
        this.oldNetwork = this.network;
        // this.network = new Network(this.oldNetwork.patterns, this.oldNetwork.patternConnections);
        this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
        let pattern: Pattern = this.network.getPatternById(currentPat.id);
        console.log(pattern.connections);

        // Remove the connections
        pattern.connections = pattern.connections.filter(connection => {
          return !(connection.id === arrToSend[0] && connection.targetId === arrToSend[1]);
        });

        pattern.connections = pattern.connections.filter(connection => {
          return !(connection.id === arrToSend[1] && connection.targetId === arrToSend[0]);
        });

        console.log(pattern.connections);
        this.resetSelectedElement();

        if (!this.network.isValid()) {
          this.network = this.oldNetwork;
          alert("Operation will break the network");
          return;
        }
        else {
          this.data.deleteConnection(arrToSend).subscribe(data => {
            var retData: any = data;
            this.resetGraph(retData.domains, retData.domainConnections);
          });
        }
      }
    }
  }




  addPattern = function () {
    if (this.data.selectedNodes.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select patterns for this operation.");
      return;
    }
    if (this.data.selectedPatterns.length === 0) {
      this.resetSelectedElement();
      alert("Please select a pattern that new pattern connect to.");
      return;
    }
    else {
      var arrToSend = [];
      //console.log(this.data.selectedPatterns);
      this.data.selectedPatterns.forEach((pid) => {
        arrToSend.push(this.network.getPatternById(pid).getConnectorNode().id);
      });
      var currentDomain = this.network.getDomainByChildNodeId(arrToSend[0]);

      this.resetSelectedElement();
      var reqData = {
        pid: arrToSend,
        did: currentDomain.id,
        dnid: currentDomain.domainNode.id
      }
      console.log(reqData);
      this.data.addPattern(reqData).subscribe((data: Network) => {
        console.log(data);
        this.resetGraph(data.domains, data.domainConnections);
      });
    }
  }

  checkConnectionExist(arrToSend: any[], arrayToCheck: any[]) {
    var flag: boolean = false;

    arrayToCheck.forEach((connector) => {
      if (connector.id === arrToSend[0] && connector.targetId === arrToSend[1]) {
        flag = true;
      }
      else if (connector.id === arrToSend[1] && connector.targetId === arrToSend[0]) {
        flag = true;
      }
      else {
        // skip
      }
    });
    return flag;
  }

  deletePattern(){
    if (this.data.selectedNodes.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedDomains.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select patterns for this operation.");
      return;
    }
    if (this.data.selectedPatterns.length !== 1) {
      this.resetSelectedElement();
      alert("Please 1 pattern to delete");
      return;
    }

    this.oldNetwork = this.network;
    this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
    let patternId: string = this.data.selectedPatterns[0];

    let affectedDomain: Domain = this.network.getDomainByPatternId(patternId);
    let connectorNode = affectedDomain.getPatternById(patternId).getConnectorNode().id;
    affectedDomain.patterns = affectedDomain.patterns.filter( p => p.id !== patternId );
    //console.log(patternId);

    affectedDomain.patternConnections = affectedDomain.patternConnections.filter( con => con.id !== connectorNode && con.targetId !== connectorNode);
    if(!this.network.isValid()) {
      this.network = this.oldNetwork;
      this.resetSelectedElement();
      console.log("not valid");
      alert("Invalid network modification");
      return;
    }

    this.data.deletePattern(this.data.selectedPatterns[0]).subscribe(data => {
      this.resetSelectedElement();
      var retData: any = data;
      this.resetGraph(retData.domains, retData.domainConnections);
    });
  }

  deleteDomain(){
    if (this.data.selectedNodes.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedPatterns.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select domain for this operation.");
      return;
    }
    if (this.data.selectedDomains.length !== 1) {
      this.resetSelectedElement();
      alert("Please 1 Domain to delete");
      return;
    }

    let selectedDomain = this.data.selectedDomains[0];
    let selectedDomainNode = this.network.getDomainById(selectedDomain).domainNode.id;

    this.resetSelectedElement();

    this.oldNetwork = this.network;
    this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);

    this.network.domains = this.network.domains.filter( domain =>{
      return domain.id !== selectedDomain;
    });

    this.network.domainConnections = this.network.domainConnections.filter( connection =>{
      return connection.id !== selectedDomainNode && connection.targetId !== selectedDomainNode;
    });
    console.log(selectedDomainNode);

    console.log(this.network.domainConnections);

    if (!this.network.isValid()) {
      this.network = this.oldNetwork;
      this.resetSelectedElement();
      console.log("not valid");
      alert("Operation will break the network");
      return;
    }
    else{
      this.data.deleteDomain( selectedDomain ).subscribe( data => {
        console.log(data);
        var resData : any = data;
        this.resetGraph(resData.domains, resData.domainConnections);
      });
    }
  }

  addDomain(){
    if (this.data.selectedNodes.length !== 0 || this.data.selectedLink.length !== 0 || this.data.selectedPatterns.length !== 0) {
      this.resetSelectedElement();
      alert("Please only select domain for this operation.");
      return;
    }
    if (this.data.selectedDomains.length === 0) {
      this.resetSelectedElement();
      alert("Please select at least one domain that new domain connect to.");
      return;
    } else {
      var arrToSend = [];
      console.log(this.data.selectedPatterns);
      console.log(this.network.getDomainById(this.data.selectedPatterns[0]));
      this.data.selectedDomains.forEach((did) => {
        arrToSend.push(this.network.getDomainById(did).domainNode.id);
      });

      this.resetSelectedElement();
      var reqData = {did : arrToSend};
      console.log(reqData);
      this.data.addDomain(reqData).subscribe((data: Network) => {
        console.log(data);
        this.resetGraph(data.domains, data.domainConnections);
      });
    }


  }


  deleteNode() {
    if (this.data.selectedLink.length !== 0 || this.data.selectedPatterns.length !== 0) {
      this.resetSelectedElement();
      alert("Please select a node to delete");
      return;
    }
    if (this.data.selectedNodes.length !== 1) {
      this.resetSelectedElement();
      alert("Please choose only one node to delete");
      return;
    }

    var selectedNodeId = this.data.selectedNodes[0];

    var reqObject: { pattern: string, node: string, conNode: string, currentNodeNum: number } = {
      pattern: this.network.getPatternByChildNodeId(selectedNodeId).id,
      node: selectedNodeId,
      conNode: this.network.getPatternByChildNodeId(selectedNodeId).getConnectorNode().id,
      currentNodeNum: this.network.getPatternByChildNodeId(selectedNodeId).nodes.length
    };
    this.resetSelectedElement();

    if (reqObject.currentNodeNum === 1 && reqObject.node !== reqObject.conNode) {
      alert("Something wrong");
      return;
    }

    if (reqObject.currentNodeNum !== 1 && reqObject.node === reqObject.conNode) {
      alert("Connector Node is the last node you can delete");
      return;
    }


    if (reqObject.currentNodeNum === 1 && reqObject.node === reqObject.conNode) {
      let sendObj = {
        node: reqObject.node,
        pid: reqObject.pattern
      };


      this.oldNetwork = this.network;
      this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
      let pattern: Pattern = this.network.getPatternById(reqObject.pattern);
      //remove the pattern
      let affectedDomain = this.network.getDomainByPatternId(reqObject.pattern);
      affectedDomain.patterns = affectedDomain.patterns.filter( p => p.id !== reqObject.pattern);
      affectedDomain.patternConnections = affectedDomain.patternConnections.filter( con => con.id !== reqObject.node && con.targetId !== reqObject.node);


      if (!this.network.isValid()) {
        this.network = this.oldNetwork;
        this.resetSelectedElement();
        console.log("not valid");
        alert("Domains must not be empty");
        return;
      }

      this.data.deleteNode(sendObj).subscribe(data => {
        console.log(data);
        var resData: any = data;
        this.resetGraph(resData.domains, resData.domainConnections);
      });
    }
    else if (reqObject.currentNodeNum > 1 && reqObject.currentNodeNum < 4 && reqObject.node !== reqObject.conNode) {

      this.oldNetwork = this.network;
      this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
      let pattern: Pattern = this.network.getPatternById(reqObject.pattern);

      // Remove the node
      pattern.nodes = pattern.nodes.filter(node => {
        return node.id !== reqObject.node;
      });
      // Remove the connections
      pattern.connections = pattern.connections.filter(connection => {
        return connection.id !== reqObject.node && connection.targetId !== reqObject.node;
      });

      if (!this.network.isValid()) {
        this.network = this.oldNetwork;
        this.resetSelectedElement();
        console.log("not valid");
        alert("Operation will break the network");
        return;
      }
      else {
        let sendObj = { node: reqObject.node };
        this.data.deleteNode(sendObj).subscribe(data => {
          console.log(data);
          var resData: any = data;
          this.resetGraph(resData.domains, resData.domainConnections);
        });
      }
    }
    else if (reqObject.currentNodeNum > 3 && reqObject.currentNodeNum < 8 && reqObject.node !== reqObject.conNode) {
      this.oldNetwork = this.network;
      this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
      //this.network = new Network(this.oldNetwork.domains, this.oldNetwork.domainConnections);
      let pattern: Pattern = this.network.getPatternById(reqObject.pattern);
      var joinNodes: string[] = [];

      // Remove the node
      pattern.nodes = pattern.nodes.filter(node => {
        return node.id !== reqObject.node;
      });
      // Remove the connections
      pattern.connections = pattern.connections.filter(connection => {
        if (connection.id === reqObject.node && connection.targetId !== reqObject.conNode) {
          joinNodes.push(connection.targetId);
        }
        if (connection.targetId === reqObject.node && connection.id !== reqObject.conNode) {
          joinNodes.push(connection.id);
        }
        return connection.id !== reqObject.node && connection.targetId !== reqObject.node;
      });

      var flag: boolean = true;
      /**
      if(joinNodes.length === 2 && reqObject.currentNodeNum === 4){
        if(!this.checkConnectionExist ( [joinNodes[0], reqObject.conNode], pattern.connections)){
          let tempArr = [];
          tempArr.push( reqObject.conNode);
          tempArr.push( joinNodes[0] );
          joinNodes = tempArr;
        }
        else if (!this.checkConnectionExist ( [joinNodes[1], reqObject.conNode], pattern.connections)){
          let tempArr = [];
          tempArr.push( reqObject.conNode);
          tempArr.push( joinNodes[1] );
          joinNodes = tempArr;
        }
      }
      **/

      if (joinNodes.length === 2) {
        if (!this.checkConnectionExist(joinNodes, pattern.connections))
          pattern.connections.push(new Connector(joinNodes[0], joinNodes[1]));
        else
          flag = false;
      }


      console.log(joinNodes);
      console.log(pattern);
      if (!this.network.isValid()) {
        this.network = this.oldNetwork;
        this.resetSelectedElement();
        console.log("not valid");
        alert("Operation will break the network");
        return;
      }
      else {
        let sendObj: any;
        if (flag) {
          sendObj = {
            node: reqObject.node,
            id: joinNodes[0],
            targetId: joinNodes[1]
          };
        }
        else {
          sendObj = { node: reqObject.node };
        }
        this.data.deleteNode(sendObj).subscribe(data => {
          console.log(data);
          var resData: any = data;
          this.resetGraph(resData.domains, resData.domainConnections);
        });
      }
    }
  }

  reset(){
    this.resetSelectedElement();
    this.cy.nodes().removeClass('highlighted');
    this.cy.nodes().removeClass('patternHighlighted');
    this.cy.edges().removeClass('highlighted');
    this.cy.nodes().removeClass('path');
    this.cy.edges().removeClass('path');
  }

  resetGraph(domains: Domain[], domainConnections: Connector[]) {

    let elements: any = [];
    let nonConnectorSelectors = "";
    let inactiveSelectors = "";
    let isConnectorSelectors = "";
    let isDomainNodeSelectors = "";

    // this.oldNetwork = this.network;
    this.network = new Network(domains, domainConnections);

    this.network.domains.forEach((domain: Domain) => {
      elements.push({
        data: {
          id: domain.id
        }
      });
      elements.push({
        data: {
          id: domain.domainNode.id,
          parent: domain.id
        }
      });
      isDomainNodeSelectors += "#" + domain.domainNode.id + ",";
      if(!domain.domainNode.isActive) {
        inactiveSelectors += "#" + domain.domainNode.id + ",";
      }
      domain.patterns.forEach((pattern: Pattern) => {
        elements.push({
          data: {
            id: pattern.id,
            parent: domain.id
          }
        });
        pattern.nodes.forEach((node: Node) => {
          elements.push({
            data: {
              id: node.id,
              parent: pattern.id
            }
          });
          if (node.isConnector) {
            isConnectorSelectors += "#" + node.id + ",";
          } else {
            nonConnectorSelectors += "#" + node.id + ",";
          }
          if (!node.isActive) {
            inactiveSelectors += "#" + node.id + ",";
          }
        });
        pattern.connections.forEach((connection: Connector) => {
          elements.push({
            data: {
              id: "" + connection.id + connection.targetId,
              source: "" + connection.id,
              target: "" + connection.targetId
            }
          });
        });
      });
      domain.patternConnections.forEach((pConnection: Connector) => {
        elements.push({
          data: {
            id: pConnection.id + pConnection.targetId,
            source: pConnection.id,
            target: pConnection.targetId
          }
        });
      });
    });

    this.network.domainConnections.forEach((dConnection: Connector) => {
      elements.push({
        data: {
          id: dConnection.id + dConnection.targetId,
          source: dConnection.id,
          target: dConnection.targetId
        }
      });
    });


    nonConnectorSelectors = nonConnectorSelectors.substr(0, nonConnectorSelectors.length - 1);
    inactiveSelectors = inactiveSelectors.substr(0, inactiveSelectors.length - 1);
    isConnectorSelectors = isConnectorSelectors.substr(0, isConnectorSelectors.length - 1);
    isDomainNodeSelectors = isDomainNodeSelectors.substr(0, isDomainNodeSelectors.length - 1);

    this.cy = cytoscape({
      container: document.getElementById('cy'), // container to render in
      elements: elements,
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            //'background-color': '#1C86EE',
            'label': 'data(id)',
            'selection-box-color': '#00FF00'
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
            'background-color': '#66CD00'
          }
        },
        {
          selector: isDomainNodeSelectors,
          style: {
            'background-color': '#FF7F00',
            'shape': 'round-rectangle',
            'width': '33px',
            'height': '33px'
          }
        },
        {
          selector: '.inactiveSelectors',
          style: {
            'background-color': '#FF3030'
          }
        },
        {
          selector: '.highlighted',
          css: {
            //'background-color': '#FF4500',
            'line-color': '#228B22',
            'border-color': '#228B22',
            'border-style': 'solid',
            'border-width': '3px'
          }
        },
        {
          selector: '.patternHighlighted',
          css: {
            'background-color': '#63B8FF'
          }
        },
        {
            selector: '.path',
            css: {
              'background-color': '#4876FF',
              'line-color':'#4876FF',
              'transition-property': 'background-color, line-color',
              'transition-duration': '0.5s'
            }
        }
        // ,
        // {
        //   selector: ':selected',
        //   css: {
        //     'background-color': 'inherit'
        //   }
        // }

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

    // this.cy.nodes().forEach(function( ele ){
    //   let idTest=ele.id();
    //   for(let inActived of _this.listTest){
    //     if(idTest===inActived){
    //       ele.addClass('inactiveSelectors');
    //     }
    //   }
    //  });


    this.cy.nodes().on('tap', function (e) {
      //let clickedNode : string;
      var clickedEle = e.target.id();
      e.preventDefault();
      e.stopPropagation();
      //collector = collector.union(clickedNode);
      if (clickedEle.charAt(0) === 'P') {//pattern

        if (_this.data.selectedPatterns.includes(clickedEle)) {//pattern is selected, deselect it
          _this.data.selectedPatterns = _this.data.selectedPatterns.filter(x => x !== clickedEle);
          e.target.removeClass('patternHighlighted');
        } else {//pattern is not selected, select it
          _this.data.selectedPatterns.push(clickedEle);
          e.target.addClass('patternHighlighted');
        }
      }
      else if ((clickedEle.charAt(0) === 'D'&&clickedEle.charAt(1) === 'N')){
        if (_this.data.selectedDomains.includes(clickedEle)) {//pattern is selected, deselect it
          _this.data.selectedDomains = _this.data.selectedDomains.filter(x => x !== clickedEle);
          e.target.removeClass('patternHighlighted');
        } else {//pattern is not selected, select it
          _this.data.selectedDomains.push(clickedEle);
          e.target.addClass('patternHighlighted');
        }
      }
      else {//node

        if (_this.data.selectedNodes.includes(clickedEle)) {//node is selected, deselect it
          _this.data.selectedNodes = _this.data.selectedNodes.filter(x => x !== clickedEle);
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

    let inactiveNodes = inactiveSelectors.split(',');
    inactiveNodes.forEach( (nid : string) =>{
      console.log(nid);
      if(nid.charAt(1) === 'N'){
        console.log("hit")
        this.cy.$( nid).addClass('inactiveSelectors');
      }
    });
    // sleep(ms:number){
    //   return new Promise(resolve=>setTimeout(resolve,ms));
    // }

    this.cy.edges().on('tap', function (e) {
      //let clickedNode : string;
      var clickedEle = e.target.id();
      e.preventDefault();
      e.stopPropagation();
      //collector = collector.union(clickedNode);
      if (_this.data.selectedLink.includes(clickedEle)) {//pattern is selected, deselect it
        _this.data.selectedLink = _this.data.selectedLink.filter(x => x !== clickedEle);
        e.target.removeClass('highlighted');
      } else {//pattern is not selected, select it
        _this.data.selectedLink.push(clickedEle);
        e.target.addClass('highlighted');
      }
    });

    this.cy.on('tap', 'edge', function (e) {
      //let clickedNode : string;
      //console.log(_this.network.patternConnections);
      var clickedEle = e.target.id();
      _this.data.selectedLink.push(clickedEle.substring(0, 3));
      _this.data.selectedLink.push(clickedEle.substring(3, 6));
    });
  }
}
