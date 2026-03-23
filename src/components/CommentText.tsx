"use client";
import React from 'react';
import { UserProfile } from '@/lib/services/userService';

interface CommentTextProps {
  text: string;
  team: UserProfile[];
}

export default function CommentText({ text, team }: CommentTextProps) {
  if (!text) return null;

  // We want to find mentions like @Full Name
  // Sort team members by name length descending to avoid partial matches 
  // (e.g., match "@John Doe" before "@John")
  const sortedTeam = [...team].sort((a, b) => (b.fullName || "").length - (a.fullName || "").length);

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  let parts: (string | JSX.Element)[] = [text];

  // 1. Detect mentions
  sortedTeam.forEach(user => {
    const name = user.fullName;
    if (!name) return;
    
    const mentionString = `@${name}`;
    const newParts: (string | JSX.Element)[] = [];

    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(mentionString);
        split.forEach((subPart, i) => {
          if (subPart) newParts.push(subPart);
          if (i < split.length - 1) {
            newParts.push(
              <span key={`${user.uid}-${i}`} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/15 border border-purple-500/20 rounded-lg text-purple-400 font-black shadow-sm mx-0.5 cursor-default hover:bg-purple-500/25 transition-all animate-in zoom-in-95 duration-200 decoration-none">
                <span className="text-[10px] opacity-70">@</span>
                <span className="text-[11px] tracking-tight">{name}</span>
              </span>
            );
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  // 2. Detect URLs
  let finalParts: (string | JSX.Element)[] = [];
  parts.forEach((part, i) => {
    if (typeof part === 'string') {
      const split = part.split(urlRegex);
      split.forEach((subPart, j) => {
        if (subPart.match(urlRegex)) {
          finalParts.push(
            <a 
              key={`link-${i}-${j}`} 
              href={subPart} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-300 transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {subPart}
            </a>
          );
        } else if (subPart) {
          finalParts.push(subPart);
        }
      });
    } else {
      finalParts.push(part);
    }
  });

  return <div className="leading-[1.8] break-words whitespace-pre-wrap">{finalParts}</div>;
}
