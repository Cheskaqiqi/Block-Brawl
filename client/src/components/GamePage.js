import React from "react";
import useKeypress from "react-use-keypress";
import classNames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../GameContext";
import { Modal } from "./Model";
import { convertToMS } from "./Timer";
import { ProgressBar } from "./ProgressBar";
import { RankingList } from "./RankingList";
import {
  changeDirection,
  breakSetBlock,
  // breakerMove,
  playerMove,
} from "./Control";

import socket from "../Socket";

function GamePage() {
  const { roomId } = useContext(AppContext);
  const navigate = useNavigate();

  const { config } = useContext(AppContext);
  const { state } = useLocation();
  //Uses the user's config to initialize the time limit for the game
  const [currentTime, setCurrentTime] = useState(config.roundTime);
  const [show, setShow] = useState(false);

  // disable breaker move if currently is breaking a ice
  const [isBreaking, setIsBreaking] = useState(false);
  // use for remove the out overlaying string
  const [showOut, setShowOut] = useState(true);

  const [leaderboardList, setLeaders] = useState();
  const [winningMessage, setWinner] = useState("");

  const [players, setPlayers] = useState([]);
  const [iceSize, setIceSize] = useState(10);

  const [me, setMe] = useState({});
  const [board, setBoard] = useState([]);
  const [done, setDone] = useState(false);

  const initGame = (game, myId) => {
    const size = calculateSize();

    setBoard(game.board);
    setIceSize(size / (game.board?.length + 3));

    const playerList = game.players;
    playerList.forEach((player) => {
      if (player.id === myId) {
        setMe(player);
      }
    });
    setPlayers(playerList);
  };

  const handleSetBreak = async (row, col) => {
    setIsBreaking(true);
    await new Promise((resolve) =>
      setTimeout(resolve, config.breakTime * 1000)
    );
    // board[row][col] = 0;
    // 切换冰的状态：如果已破则复原，如果未破则破坏
    // board[row][col] = board[row][col] === 1 ? 0 : 1;
    if (board[row][col] === 1) {
      board[row][col] = 0;
    } else if (board[row][col] === 0) {
      board[row][col] = 1;
    } else if (board[row][col] === 4) {
      board[row][col] = 5;
    } else if (board[row][col] === 5) {
      board[row][col] = 4;
    }
    setBoard([...board]);
    socket.emit("break", { roomId, y: col, x: row });
    setIsBreaking(false);
  };

  const handleBreak = async (row, col) => {
    setIsBreaking(true);
    await new Promise((resolve) =>
      setTimeout(resolve, config.breakTime * 1000)
    );
    // board[row][col] = 0;
    // 切换冰的状态：如果已破则复原，如果未破则破坏
    board[row][col] = 1;
    setBoard([...board]);
    socket.emit("breakonly", { roomId, y: col, x: row });
    setIsBreaking(false);
  };

  const calculateSize = () => {
    const initWidth = window.innerWidth * 0.65;
    const initHeight = window.innerHeight - 20;
    return initWidth > initHeight ? initHeight : initWidth;
  };
  const windowSizeChanged = () => {
    const size = calculateSize();
    setIceSize(size / (board?.length + 3));
  };
  window.addEventListener("resize", windowSizeChanged);

  const onThisIce = (player, row, col) => {
    return player.x === row && player.y === col;
  };

  const handlePlayerMove = (event) => {
    const keyName = event.key;

    if (me.isAlive && !done) {
      // what every move or not, direction need to change
      if (me.isBreaker && !isBreaking) {
        changeDirection(me, keyName);
        if (keyName === " ") {
          // Space is typically denoted by " " in event.key
          // handle break ice using space

          breakSetBlock(me, board, handleBreak);
        } else {
          playerMove(keyName, me, board.length, board);
          //  playerMove(keyName, me, board.length, setBoard, board);
        }
      } else if (!me.isBreaker) {
        changeDirection(me, keyName);
        // normal non-breaker players on the ice

        if (keyName === " ") {
          breakSetBlock(me, board, handleSetBreak);
        } else {
          playerMove(keyName, me, board.length, board);
          //playerMove(keyName, me, board.length, setBoard, board);
          // 现在检查移动后的新位置
          const newValue = board[me.x][me.y];

          // 如果玩家移动到的位置的值是 4
          if (newValue === 4) {
            // 则更新 board 状态
            setBoard((prevBoard) => {
              // 创建 board 状态的深拷贝
              const newBoard = prevBoard.map((row) => [...row]);
              // 将位置的值从 4 改为 5
              newBoard[me.x][me.y] = 1;
              return newBoard;
            });

            setMe((prevMe) => ({
              ...prevMe,
              score: prevMe.score + 1,
            }));
          }
        }
      }
      socket.emit("movement", {
        roomId,
        x: me.x,
        y: me.y,
        direction: me.direction,
      });
      // You may need to use a functional update if `me` is a state variable
      setMe((prevMe) => ({ ...prevMe }));
    }
  };

  useKeypress(
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "],
    handlePlayerMove
  );

  useEffect(() => {
    // @ts-ignore
    if (!!state.game) initGame(state.game, socket.id);

    const onGameUpdate = (game) => initGame(game, socket.id);
    const onGameEnd = (room) => {
      room.players.sort(function (a, b) {
        return b.score - a.score;
      });

      setLeaders(room.players);
      // Find 'me' in the room's player list and update its 'isAlive' status
      const meInRoom = room.players.find((player) => player.id === socket.id);
      if (meInRoom) {
        setMe((prevMe) => ({ ...prevMe, isAlive: meInRoom.isAlive }));
      }

      // Set the message to display and get the winner
      if (
        room.players.filter((player) => player.isAlive && !player.isBreaker)
          .length === 0
      ) {
        setWinner("The Monster Wins !!!");
      } else {
        setWinner("Babo Win !!!");
      }
      //Open Modal window
      setShow(true);
    };

    //Update time
    const onGameTimeChanged = (time) => {
      setCurrentTime(time);
    };

    const gameDone = () => {
      setDone(true);
    };
    socket.on("room-closed", gameDone); //Set up socket on room-closed, to close the game
    socket.on("game-update", onGameUpdate);
    socket.on("game-end", onGameEnd);
    socket.on("game-time-changed", onGameTimeChanged);

    return () => {
      socket.off("room-closed", gameDone);
      socket.off("game-update", onGameUpdate);
      socket.off("game-end", onGameEnd);
      socket.off("game-time-changed", onGameTimeChanged);
    };
    // @ts-ignore
  }, [navigate, roomId, state.game]);

  const renderIceType1 = (iceSize, row, col, players) => {
    // ...渲染ice为1的逻辑
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center bg-no-repeat bg-center bg-cover bg-center shadow-md player bg-floor"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col)) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType0 = (iceSize, row, col, players) => {
    // ...渲染ice为0的逻辑
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-cover bg-center player bg-block bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType3 = (iceSize, row, col, players) => {
    // ...渲染ice为0的逻辑
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-cover bg-center player  bg-fire bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType4 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat  bg-center player bg-floor_bean bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType5 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-block_bean bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType6 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-wall bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };
  const renderIceType7 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-roof_red bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };
  const renderIceType8 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-roof_blue bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };
  const renderIceType9 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-stall bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  const renderIceType11 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-wall_left bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };
  const renderIceType12 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-wall_right bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };
  const renderIceType13 = (iceSize, row, col, players) => {
    // for groundfood
    return (
      <div
        style={{
          width: Math.round(iceSize),
          height: Math.round(iceSize),
          margin: 0,
        }}
        className="flex items-center justify-center m-2 bg-no-repeat bg-coverc bg-center player bg-wall_water bg-block_bg_color"
      >
        {players.map((item, index) => {
          if (onThisIce(item, row, col) && item.isBreaker) {
            return <PlayerAvatar key={index} player={item} ice={iceSize} />;
          } else return null;
        })}
      </div>
    );
  };

  // 创建映射表
  const iceRenderers = {
    0: renderIceType0,
    1: renderIceType1,
    3: renderIceType3,
    4: renderIceType4,
    5: renderIceType5,
    6: renderIceType6,
    7: renderIceType7,
    8: renderIceType8,
    9: renderIceType9,
    11: renderIceType11,
    12: renderIceType12,
    13: renderIceType13,
  };

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col h-screen overflow-y-auto bg-room bg-center bg-cover font-bold text-pink-300">
        <div className="relative flex text-2xl item-center justify-center">
          {
            me.isAlive ? (
              <div className="w-[4.5rem] h-[4.5rem]">
                <img src="/assets/heart.png" alt="Alive"/>
              </div>
            ) : (
              <div className="w-[3rem] h-[3rem] mt-1 mb-1">
                <img src="/assets/die.png" alt="Die"/>
              </div>
            ) /* top right symbol for indicate the player out, which is "spectating"  justify-end right-5 */
          }
          {!me.isAlive && (
            <div className="absolute flex flex-row justify-center p-[7.5rem]">
              <div className="">Spectating</div>
            </div>
          )}
        </div>

        <div>
          {/* Modal window for the leaderboard when game ends */}
          <Modal
            title={<div>{winningMessage}</div>}
            show={show}
            pageJump={() => {
              navigate("/homepage");
            }}
            mainPrompt={<RankingList list={leaderboardList} myID={me.id} />}
            buttonPrompt={"Back to Room"}
          />

          <div>
            <ProgressBar currentTime={currentTime} maxTime={config.roundTime} />
          </div>
          <div className="flex text-2xl item-center justify-center mt-2 mb-10">
            {convertToMS(currentTime)}
          </div>

          <div>
            <div className="flex item-center justify-center">
            {/* Dead indicator, overlaying string */}
            {!me.isAlive && showOut && (
              <div className="absolute z-40 flex flex-row animate-bounce">
                <div
                  style={{
                    fontSize: 100,
                  }}
                  className="text-custom-text-pink text-9xl"
                  onClick={() => setShowOut(false)}
                >
                  You're die!
                </div>
              </div>
            )}
            </div>

            <div className="">
              {board
                ? board.map((rowItems, row) => {
                    return (
                      <div
                        className="flex flex-row item-center justify-center"
                        key={row}
                      >
                        {rowItems.map((ice, col) => {
                          // 调用映射表中的渲染函数
                          const renderFunc = iceRenderers[ice];
                          return renderFunc
                            ? renderFunc(iceSize, row, col, players)
                            : null;
                        })}
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;

// Get imgae path based on players' chosen colors and direction
function getIcon(props, colors) {
  const myColor = colors[props.player.colorId ?? 0]; //Obtain each player's color from the color list
  var direction = props.player.direction;

  if (props.player.direction === "LEFT") {
    direction = "RIGHT";
  } else if (props.player.direction === "RIGHT") {
    direction = "LEFT";
  }

  return props.player.isBreaker
    ? "../assets/p_" +
        direction.toLowerCase() +
        "_" +
        myColor.toString().substring(1) +
        ".png"
    : "../assets/p_" +
        direction.toLowerCase() +
        "_" +
        myColor.toString().substring(1) +
        ".png";
}

// Display user Image on the board
function PlayerAvatar(props) {
  //Get the color list for players from the context
  const { colors } = useContext(AppContext);

  const img_path = getIcon(props, colors);

  if (props.player.isAlive) {
    return (
      <div
        className={classNames(
          "playerme flex items-center justify-center text-white rounded-2xl text "
        )}
      >
        <div
          className="flex items-center justify-center "
          style={{ width: props.ice * 0.85, height: props.ice * 0.85 }}
        >
          {/* Use created asset img in public/avatars/ with responsive size */}
          <img
            src={process.env.PUBLIC_URL + img_path}
            width={props.ice * 0.8}
            alt="player"
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
}
