import {EqualityEnum} from './equalityEnum';

export class NodeData {
  public id?: string;
  public key: string;
  public value: string;

  public equal(this, another: NodeData): EqualityEnum {
    if (this.key === another.key && this.value === another.value) {
      return EqualityEnum.Equal;
    }

    return EqualityEnum.Different;
  }
}
