import { Character } from "../../../../entity/character";
import { Tilemap } from "../../../../entity/tilemap";
import { CharacterFactory } from "../../../../factory/characterFactory";
import { CoordFactory } from "../../../../factory/coordFactory";
import { Params } from "../../../../params";
import { Coord } from "../../../../vo/coord";
import { MapService } from "../../../map/mapService";
import { SimulatePositionImpl } from "../../../simulate/position/impl/simulatePositionImpl";
import { SimulatePositionService } from "../../../simulate/position/simulatePositionService";
import { OperatePositionCommonService } from "../operatePositionCommonService";
import { OperatePositionService } from "../operatePositionService";
import { RandomImpl } from "./randomImpl";

export class AnnelingImpl extends OperatePositionCommonService implements OperatePositionService {
    /**
     * シーン
     */
    private scene: Phaser.Scene;
    /**
     * ランダムにキャラクターの初期位置をセットするクラス
     */
    private randomImpl: RandomImpl;
    /**
     * 繰り返し回数
     */
    private repeat: number = 1000;
    /**
     * シミュレーションの繰り返し回数
     * この数だけ状態遷移を試み、最適な解を探索する
     */
    private simulate_number: number = 10000;
    /**
     * シミュレーションの初期温度を表す
     * この値が大きいほど、初期の探索では悪化する繊維も許容されやすくなる
     */
    private start_temp: number = 500;
    /**
     * シミュレーションの最終温度を表す
     * この数値が小さいほど、シミュレーションの終盤では悪化する繊維が許容されにくくなる
     */
    private end_temp: number = 10;
    /**
     * 乱数生成の反映を指定するための数字
     */
    private readonly INF: number = 1000000000;

    constructor(scene: Phaser.Scene) {
        super();
        this.scene = scene;
        this.randomImpl = new RandomImpl(scene);
    }

    /**
     * キャラクターを生成する
     * @param tilemap タイルマップ
     * @returns キャラクター
     */
    public getCharacters(tilemap: Tilemap): Character[] {
        const characters: Character[] = this.createRandomCharacters(tilemap);
        const simulate: SimulatePositionService = new SimulatePositionImpl(characters, tilemap.mapState);

        return this.getAnnealingCharacters(simulate, tilemap);
    }

    /**
     * キャラクターを焼きなまし法で生成する
     * @param simulate シミュレーション
     * @param tilemap タイルマップ
     * @returns キャラクター
     */
    private getAnnealingCharacters(simulate: SimulatePositionService, tilemap: Tilemap): Character[] {
        let bestScore: [number, Coord[]] = [-1, []];
        let nowBeam: SimulatePositionService = simulate;

        for (let i=0; i<this.repeat; i++) {
            while(!nowBeam.isDone()) {
                MapService.simulatePosition(nowBeam);
            }
            nowBeam.evaluate();

            const temp: number = this.start_temp + (this.end_temp - this.start_temp) * (i / this.simulate_number);
            const probability: number = Math.exp((nowBeam.evaluatedScore - bestScore[0]) / temp);
            const is_force_next: boolean = probability > (Math.random() * this.INF) / this.INF;

            let coords: Coord[];
            if (nowBeam.evaluatedScore > bestScore[0]) {
                bestScore[0] = nowBeam.evaluatedScore;
                bestScore[1] = nowBeam.firstCoords;
                coords = bestScore[1];
            } else {
                coords = is_force_next ? nowBeam.firstCoords : bestScore[1];
            }

            const characters = this.createRandomCharactersByCoords(tilemap, coords, i % Params.CHARACTER_NUM);
            nowBeam.deleteAllCharacters();
            nowBeam.init(characters);
        }
        nowBeam.deleteAllCharacters();

        const bestCharacters: Character[] = this.createCharactersByCoords(tilemap, bestScore[1]);
        this.initializations(tilemap, bestCharacters);

        return bestCharacters;
    }

    /**
     * キャラクターの初期位置をランダムにセットする
     * @param tilemap タイルマップ
     * @param characters キャラクター
     * @returns キャラクター
     */
    private createRandomCharacters(tilemap: Tilemap, characters: Character[] = []): Character[] {
        return this.randomImpl.create(tilemap, characters);
    }

    /**
     * ベストスコアの座標から指定の座標を変更したキャラクターを生成する
     * @param tilemap タイルマップ
     * @param bestCoords べストな座標
     * @param targetIndex 座標を変更する配列のインデックス
     * @returns キャラクター
     */
    private createRandomCharactersByCoords(tilemap: Tilemap, bestCoords: Coord[], targetIndex: number): Character[] {
        const nextCoords: Coord[] = this.createRandomCoord(bestCoords, targetIndex);
        return this.createCharactersByCoords(tilemap, nextCoords);
    }

    /**
     * 指定の座標を変更する
     * @param coords 座標
     * @param targetIndex 特定の座標のインデックス
     * @returns 座標
     */
    private createRandomCoord(coords: Coord[], targetIndex: number): Coord[] {
        let nextCoord: Coord[] = [...coords];
        let randomCoord: Coord;

        do {
            randomCoord = CoordFactory.randomCoord();
        } while (nextCoord.includes(randomCoord));

        nextCoord[targetIndex] = randomCoord;
        return nextCoord;
    }

    /**
     * 座標からキャラクターを生成する
     * @param tilemap タイルマップ
     * @param coords 座標
     * @returns キャラクター
     */
    private createCharactersByCoords(tilemap: Tilemap, coords: Coord[]): Character[] {
        let characters: Character[] = [];
        for (const coord of coords) {
            characters.push(CharacterFactory.createForTargetPos(this.scene, tilemap, coord));
        }
        return characters;
    }
}