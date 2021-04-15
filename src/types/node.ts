import {NodeData} from './nodeData';
import {EqualityEnum} from './equalityEnum';

export class Node {
  public id: string = null;
  public type: string;
  public value: NodeData[] = [];
  public nodes: Node[] = [];

  public includedOrEqual(this, another: Node, depth: number = 0): EqualityEnum {
    if (this.type !== another.type) {
      return EqualityEnum.Different;
    }

    for (const val of another.value) {
      if (this.value.findIndex(v => v.equal(val) === EqualityEnum.Equal) < 0) {
        return EqualityEnum.Different;
      }
    }

    for (const val of this.value) {
      if (another.value.findIndex(v => v.equal(val) === EqualityEnum.Equal) < 0) {
        return EqualityEnum.Different;
      }
    }

    if (depth === 0) {
      return EqualityEnum.Equal;
    }

    for (const node of another.nodes) {
      if (this.nodes.findIndex(n => n.includedOrEqual(node, depth - 1) === EqualityEnum.Equal) < 0) {
        return EqualityEnum.Similar;
      }
    }

    return EqualityEnum.Equal;
  }
}
