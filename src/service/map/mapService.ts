import { Character } from "../../entity/character";
import { Coord } from "../../vo/coord";
import { Tilemap } from "../../entity/tilemap";
import { DirectionType } from "../../type/directionType";
import { SimulateDirectionService } from "../simulate/direction/simulateDirectionService";
import { MapState } from "../../entity/mapState";
import { SimulatePositionService } from "../simulate/position/simulatePositionService";
import { GreedyImpl } from "../operate/direction/impl/greedyImpl";
import { OperateDirectionService } from "../operate/direction/operateDirectionService";

export class MapService {

    /**
     * キャラクターをグリッド移動させる
     * タイルマップやポイントの更新も行う
     * @param character キャラクター
     * @param tilemap タイルマップ
     * @param direction 移動方向
     * @param tweenDuration キャラクターの移動にかかる時間
     */
    public static advance(character: Character, tilemap: Tilemap, direction: DirectionType): void {
        try {
            const nextCoord: Coord = this.getMoveToCoordFromCharacter(character, direction);
            character.startWalk(nextCoord, direction);
            this.gridWalkTween(character, tilemap, nextCoord, () => { tilemap.advance(character, nextCoord) });
        } catch {
            return;
        }
    }

    /**
     * キャラクターを移動させる（シミュレーション用）
     * @param simulate シミュレーション
     * @param direction 移動方向
     */
    public static simulate(simulate: SimulateDirectionService, direction: DirectionType): void {
        try {
            const nextCoord: Coord = this.getMoveToCoordFromCharacter(simulate.character, direction);
            simulate.character.startWalk(nextCoord, direction);
            simulate.mapState.advance(simulate.character, nextCoord);
        } catch {
            return;
        }
    }

    /**
     * キャラクターを移動させる（シミュレーション用）
     * @param simulate シミュレーション
     * @returns 
     */
    public static simulatePosition(simulate: SimulatePositionService): void {
        const greedyDirection: OperateDirectionService = new GreedyImpl();

        try {
            simulate.characters.map(character => {
                const direction = greedyDirection.getDirection(character, simulate.mapState);
                const nextCoord = this.getMoveToCoordFromCharacter(character, direction);

                return { character, nextCoord, direction };
            }).forEach(({ character, nextCoord, direction }) => {
                character.startWalk(nextCoord, direction);
                simulate.mapState.advance(character, nextCoord);
            });
        } catch {
            return;
        }
    }

    /**
     * 指定されたキャラクターが移動できる方向を返す
     * @param character キャラクター
     * @returns 移動できる方向
     */
    public static legalDirections(character: Character) {
        const directions: DirectionType[] = [];
        for (let direction=0; direction<4; direction++) {
            try {
                // 座標が取得できるということは移動できるため、移動方向を追加する
                this.getMoveToCoordFromCharacter(character, direction);
                directions.push(direction);
            } catch {
                continue;
            }
        }
        return directions;
    }

    /**
     * 指定された移動方向から移動先のポイントを返す
     * @param character キャラクター
     * @param tilemap タイルマップ
     * @param direction 移動方向
     * @returns キャラクターの移動先のポイント
     */
    public static getPointByDirection(character: Character, mapState: MapState, direction: DirectionType): number {
        try {
            const nextCoord: Coord = this.getMoveToCoordFromCharacter(character, direction);
            return mapState.getPoint(nextCoord);
        } catch {
            return 0;
        }
    }

    /**
     * 指定された移動方向からキャラクターの移動先の座標を返す
     * @param character キャラクター
     * @param direction 移動方向
     * @returns キャラクターの移動先の座標
     */
    private static getMoveToCoordFromCharacter(character: Character, direction: DirectionType): Coord {
        return character.getCoord().getMoveToCoord(direction);
    }

    /**
     *　キャラクターをグリッド移動させる
     * @param character キャラクター
     * @param tilemap タイルマップ
     * @param nextCoord 移動先の座標
     * @param onComplete 移動後の処理
     */
     private static gridWalkTween(character: Character, tilemap: Tilemap, nextCoord: Coord, onComplete: () => void) {
        const nowPos = character.getPos();
        const nextPos = tilemap.getWorldPos(nextCoord);

        let tween: Phaser.Tweens.Tween = character.getSprite().scene.add.tween({
            targets: [character.getSprite()],
            x: {
                getStart: () => nowPos.x,
                getEnd: () => nextPos.x,
            },
            y: {
                getStart: () => nowPos.y,
                getEnd: () => nextPos.y,
            },
            duration: 500,
            onComplete: () => {
                tween.stop()
                character.stopWalk();
                onComplete()
            }
        })
    }
}