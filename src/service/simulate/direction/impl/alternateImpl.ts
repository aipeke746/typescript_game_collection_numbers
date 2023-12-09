import { Character } from "../../../../entity/character";
import { MapState } from "../../../../entity/mapState";
import { DirectionType } from "../../../../type/directionType";
import { CharacterFactory } from '../../../../factory/characterFactory';
import { SimulateDirectionService } from "../simulateDirectionService";

export class AlternateImpl implements SimulateDirectionService {
    /**
     * 自分のキャラクター
     */
    public character: Character;
    /**
     * 相手のキャラクター
     */
    public opponent: Character;
    /**
     * マップの状態
     */
    public mapState: MapState;
    /**
     * キャラクターの最初の移動方向（必要ないため未使用）
     */
    public firstDirection: DirectionType = DirectionType.NONE;
    /** 
     * シミュレーションの評価値
     */
    public evaluatedScore: number;

    constructor(character: Character, opponent: Character, mapState: MapState, evaluatedScore: number = 0) {
        this.character = CharacterFactory.clone(character);
        this.opponent = CharacterFactory.clone(opponent);
        this.mapState = mapState.clone();
        this.evaluatedScore = evaluatedScore;
    }

    /**
     * シミュレーションを複製する
     * @returns シミュレーションの複製
     */
    public clone(): AlternateImpl {
        return new AlternateImpl(this.character, this.opponent, this.mapState, this.evaluatedScore);
    }

    /**
     * シミュレーションを評価する
     */
    public evaluate(): void {
        this.evaluatedScore = this.character.getScore() - this.opponent.getScore();
    }

    /**
     * シミュレーションが終了したかどうかを返す
     * @returns シミュレーションが終了したかどうか
     */
    public isDone(): boolean {
        return this.mapState.isDone();
    }
}