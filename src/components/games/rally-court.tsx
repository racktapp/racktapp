
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { RallyGame, User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RallyCourtProps {
  game: RallyGame;
  currentUser: User;
}

const Player = ({ position, isCurrentUser }: { position: { x: string; y: string }, isCurrentUser: boolean }) => (
  <div
    className={cn(
      'absolute w-6 h-6 rounded-full transition-all duration-500 ease-out border-2 border-background',
      isCurrentUser ? 'bg-primary' : 'bg-destructive'
    )}
    style={{
      left: position.x,
      top: position.y,
      transform: 'translate(-50%, -50%)',
    }}
  />
);

const Ball = ({ position }: { position: { x: string; y: string }}) => (
  <div
    className="absolute w-4 h-4 bg-yellow-400 rounded-full transition-all duration-700 ease-in-out shadow-md border-2 border-white/50"
    style={{
      left: position.x,
      top: position.y,
      transform: 'translate(-50%, -50%)',
    }}
  />
);

export function RallyCourt({ game, currentUser }: RallyCourtProps) {
  const animatedPointIndex = useRef(-1);

  // Memoize positions to prevent re-creation on every render
  const myBaseline = useMemo(() => ({ x: '50%', y: '85%' }), []);
  const opponentBaseline = useMemo(() => ({ x: '50%', y: '15%' }), []);
  const myServeBox = useMemo(() => ({ x: '50%', y: '62.5%' }), []);
  const opponentServeBox = useMemo(() => ({ x: '50%', y: '37.5%' }), []);

  // Positions for the *upcoming* point
  const isNextServerMe = useMemo(() => game.currentPoint.servingPlayer === currentUser.uid, [game.currentPoint.servingPlayer, currentUser.uid]);

  const nextServerStartPosition = useMemo(() => (isNextServerMe ? myBaseline : opponentBaseline), [isNextServerMe, myBaseline, opponentBaseline]);
  const nextReturnerStartPosition = useMemo(() => (isNextServerMe ? opponentBaseline : myBaseline), [isNextServerMe, opponentBaseline, myBaseline]);

  const [myPlayerPos, setMyPlayerPos] = useState(() => (isNextServerMe ? myBaseline : opponentBaseline));
  const [opponentPlayerPos, setOpponentPlayerPos] = useState(() => (isNextServerMe ? opponentBaseline : myBaseline));
  const [ballPos, setBallPos] = useState(() => nextServerStartPosition);

  useEffect(() => {
    const lastPointIndex = game.pointHistory.length - 1;
    const lastPoint = game.pointHistory[lastPointIndex];

    // Animate only once when a new point is finished
    if (game.turn === 'point_over' && lastPoint && animatedPointIndex.current !== lastPointIndex) {
      animatedPointIndex.current = lastPointIndex;

      const iAmServerForLastPoint = lastPoint.servingPlayer === currentUser.uid;
      const serverWon = lastPoint.winner === lastPoint.servingPlayer;

      // Determine final ball position for the animation
      let finalBallPos;
      if (serverWon) {
        // Winner hits a winner, ball goes off the opponent's court
        finalBallPos = iAmServerForLastPoint ? { ...opponentBaseline, y: '5%' } : { ...myBaseline, y: '95%' };
      } else {
        // Loser makes an error, ball goes off their own court
        finalBallPos = iAmServerForLastPoint ? { ...myBaseline, y: '95%' } : { ...opponentBaseline, y: '5%' };
      }
      
      const pointServerStartPos = iAmServerForLastPoint ? myBaseline : opponentBaseline;
      const pointReturnerStartPos = iAmServerForLastPoint ? opponentBaseline : myBaseline;
      
      // --- Animation Sequence ---
      // 1. Reset players and ball to their starting positions for the point that just finished
      setMyPlayerPos(myBaseline);
      setOpponentPlayerPos(opponentBaseline);
      setBallPos(pointServerStartPos);

      // 2. Animate Serve
      setTimeout(() => setBallPos(pointReturnerStartPos), 100);
      // 3. Animate Return
      setTimeout(() => setBallPos(pointServerStartPos), 800);
      // 4. Animate Final Shot
      setTimeout(() => {
        setBallPos(finalBallPos);
        // Move players to react
        setMyPlayerPos(myServeBox);
        setOpponentPlayerPos(opponentServeBox);
      }, 1500);

    } else if (game.turn === 'serving') {
      // Reset player and ball positions for the start of the new point
      setMyPlayerPos(nextServerStartPosition);
      setOpponentPlayerPos(nextReturnerStartPosition);
      setBallPos(nextServerStartPosition);
    }
  }, [
    game.turn, 
    game.pointHistory,
    currentUser.uid, 
    myBaseline, 
    opponentBaseline, 
    myServeBox, 
    opponentServeBox, 
    nextServerStartPosition, 
    nextReturnerStartPosition
  ]);


  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[1/2] bg-green-600 border-4 border-white/80 rounded-lg p-2 mb-8 shadow-lg">
      {/* Outer court lines */}
      <div className="absolute inset-2 border-2 border-white/80">
        {/* Net */}
        <div className="absolute top-1/2 left-[-2px] w-[calc(100%+4px)] h-0.5 bg-white/50 z-10" />
        {/* Service boxes */}
        <div className="absolute top-1/4 left-0 w-full h-1/2 border-y-2 border-white/80" />
        <div className="absolute top-1/4 left-1/2 w-0 h-1/2 border-l-2 border-white/80" />
      </div>

      {/* Players and Ball */}
      <div className="relative w-full h-full">
        <Player position={myPlayerPos} isCurrentUser={true} />
        <Player position={opponentPlayerPos} isCurrentUser={false} />
        <Ball position={ballPos} />
      </div>
    </div>
  );
}
