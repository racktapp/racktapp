'use client';

import { useState, useEffect } from 'react';
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
  const isServerMe = game.currentPoint.servingPlayer === currentUser.uid;
  
  // Define positions in percentages
  const myBaseline = { x: '50%', y: '85%' };
  const opponentBaseline = { x: '50%', y: '15%' };
  const myServeBox = { x: '50%', y: '62.5%' };
  const opponentServeBox = { x: '50%', y: '37.5%' };
  
  const serverStartPosition = isServerMe ? myBaseline : opponentBaseline;
  const returnerStartPosition = isServerMe ? opponentBaseline : myBaseline;

  const [myPlayerPos, setMyPlayerPos] = useState(myBaseline);
  const [opponentPlayerPos, setOpponentPlayerPos] = useState(opponentBaseline);
  const [ballPos, setBallPos] = useState(serverStartPosition);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const lastPoint = game.pointHistory[game.pointHistory.length - 1];
    if (game.turn === 'point_over' && lastPoint && !isAnimating) {
        setIsAnimating(true);
        
        const serverWon = lastPoint.winner === lastPoint.servingPlayer;
        const iAmServer = lastPoint.servingPlayer === currentUser.uid;

        // Determine final ball position
        let finalBallPos;
        if (serverWon) {
            finalBallPos = iAmServer ? { ...opponentBaseline, y: '5%' } : { ...myBaseline, y: '95%' };
        } else {
            finalBallPos = iAmServer ? { ...myBaseline, y: '95%' } : { ...opponentBaseline, y: '5%' };
        }

        // Animation sequence
        // 1. Reset to start
        setMyPlayerPos(myBaseline);
        setOpponentPlayerPos(opponentBaseline);
        setBallPos(serverStartPosition);

        // 2. Serve
        setTimeout(() => {
            setBallPos(returnerStartPosition);
        }, 100);

        // 3. Return
        setTimeout(() => {
            setBallPos(serverStartPosition);
        }, 800);
        
        // 4. Final shot
        setTimeout(() => {
            setBallPos(finalBallPos);
            // Move players to react
            setMyPlayerPos(myServeBox);
            setOpponentPlayerPos(opponentServeBox);
        }, 1500);

        // 5. End animation state
        setTimeout(() => {
            setIsAnimating(false);
        }, 2500);

    } else if (game.turn === 'serving') {
        // Reset positions for a new point
        setMyPlayerPos(myBaseline);
        setOpponentPlayerPos(opponentBaseline);
        setBallPos(serverStartPosition);
    }
  }, [game.turn, game.pointHistory, currentUser.uid, isAnimating, isServerMe, opponentBaseline, myBaseline, serverStartPosition, returnerStartPosition, opponentServeBox, myServeBox]);

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
