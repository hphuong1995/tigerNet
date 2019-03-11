export class Connector {
    public id: string;
    public targetId: string;
    constructor(id: string, targetId: string) {
        this.id = id;
        this.targetId = targetId;
    }

    public validateConnector(){
      return !(this.id === this.targetId);
    }

    public compareTo( other :Connector){
      if( this.id === other.id && this.targetId === other.targetId){
        return true;
      }
      if( this.id === other.targetId && this.targetId === other.id){
        return true;
      }
      return false;
    }
}
