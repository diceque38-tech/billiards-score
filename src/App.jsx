import React, { useMemo, useState } from "react";
import { Plus, Minus, Trophy, Trash2, Settings } from "lucide-react";

const PLAYERS = [
  { id: "p1", name: "大島" },
  { id: "p2", name: "安部" },
  { id: "p3", name: "宮本" },
];
const today = () => new Date().toLocaleDateString("sv-SE");
const signed = n => n > 0 ? `+${n}` : `${n}`;
const zeroPast = () => ({
  p1: { wins: 0, losses: 0, points: 0 },
  p2: { wins: 0, losses: 0, points: 0 },
  p3: { wins: 0, losses: 0, points: 0 },
});

export default function App() {
  const [date, setDate] = useState(today());
  const [selected, setSelected] = useState([]);
  const [winner, setWinner] = useState("");
  const [points, setPoints] = useState(3);
  const [games, setGames] = useState([]);
  const [pastRecords, setPastRecords] = useState([]);
  const [pastDate, setPastDate] = useState(today());
  const [pastInput, setPastInput] = useState(zeroPast());
  const [tab, setTab] = useState("play");

  const active = PLAYERS.filter(p => selected.includes(p.id));
  const loser = active.find(p => p.id !== winner);
  const todayGames = useMemo(() => games.filter(g => g.date === date).slice().reverse(), [games, date]);
  const pastPointTotal = Object.values(pastInput).reduce((sum, x) => sum + Number(x.points || 0), 0);

  const choose = id => {
    setSelected(current => {
      if (current.includes(id)) {
        setWinner("");
        return current.filter(x => x !== id);
      }
      if (current.length < 2) {
        const next = [...current, id];
        if (next.length === 2) setWinner(next[0]);
        return next;
      }
      const next = [current[1], id];
      setWinner(next[0]);
      return next;
    });
  };

  const registerGame = () => {
    if (active.length !== 2 || !winner || !loser) return;
    const winnerPlayer = PLAYERS.find(p => p.id === winner);
    setGames(old => [...old, {
      id: `${Date.now()}-${Math.random()}`,
      date,
      winnerId: winner,
      winnerName: winnerPlayer?.name || "",
      loserId: loser.id,
      loserName: loser.name,
      points: Number(points),
      createdAt: Date.now(),
    }]);
    setPoints(3);
  };

  const registerPast = () => {
    if (pastPointTotal !== 0) return;
    setPastRecords(old => [{ id: `${Date.now()}-past`, date: pastDate, stats: pastInput }, ...old]);
    setPastInput(zeroPast());
  };

  const allDates = useMemo(() => [...new Set([...games.map(g => g.date), ...pastRecords.map(r => r.date)])].sort((a,b) => b.localeCompare(a)), [games, pastRecords]);

  const statsForDate = d => PLAYERS.map(p => {
    const dayGames = games.filter(g => g.date === d);
    const past = pastRecords.filter(r => r.date === d);
    const pastWins = past.reduce((s,r) => s + Number(r.stats[p.id]?.wins || 0), 0);
    const pastLosses = past.reduce((s,r) => s + Number(r.stats[p.id]?.losses || 0), 0);
    const pastPoints = past.reduce((s,r) => s + Number(r.stats[p.id]?.points || 0), 0);
    return {
      ...p,
      wins: pastWins + dayGames.filter(g => g.winnerId === p.id).length,
      losses: pastLosses + dayGames.filter(g => g.loserId === p.id).length,
      points: pastPoints + dayGames.reduce((s,g) => g.winnerId === p.id ? s + g.points : g.loserId === p.id ? s - g.points : s, 0),
    };
  });

  return <div className="app-shell">
    <main>
      <header>
        <div><div className="brand"><Trophy size={18}/><span>BILLIARDS</span></div><h1>スコア管理</h1></div>
        <input className="date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      </header>

      <nav>
        <button onClick={()=>setTab("play")} className={tab==="play" ? "active" : ""}>対戦</button>
        <button onClick={()=>setTab("history")} className={tab==="history" ? "active" : ""}>履歴</button>
        <button aria-label="設定" title="設定" onClick={()=>setTab("settings")} className={`settings ${tab==="settings" ? "active" : ""}`}><Settings size={19}/></button>
      </nav>

      {tab === "play" && <div>
        <section>
          <div className="hint">対戦する2人をタップ</div>
          <div className="three">{PLAYERS.map(p => <button key={p.id} onClick={()=>choose(p.id)} className={selected.includes(p.id) ? "selected" : ""}>{p.name}</button>)}</div>
          {active.length !== 2 && <div className="warning">対戦者を2人選んでください</div>}
        </section>
        {active.length === 2 && <>
          <section><div className="hint">勝者をタップ</div><div className="two">{active.map(p=><button key={p.id} onClick={()=>setWinner(p.id)} className={winner===p.id ? "winner" : ""}>{winner===p.id ? "★ " : ""}{p.name}</button>)}</div></section>
          <section><div className="hint center">勝者のポイント（最低3）</div><div className="counter"><button onClick={()=>setPoints(Math.max(3,points-1))}><Minus size={30}/></button><strong>{points}</strong><button className="plus" onClick={()=>setPoints(points+1)}><Plus size={32}/></button></div><div className="two result"><div>{PLAYERS.find(p=>p.id===winner)?.name}<b>+{points}</b></div><div>{loser?.name}<b>-{points}</b></div></div></section>
          <button onClick={registerGame} className="save"><Plus size={20}/>この結果を登録</button>
        </>}
        <div className="today"><h2>今日の成績</h2>{todayGames.length===0 ? <div className="empty">まだ記録はありません</div> : todayGames.map((g,i)=><div key={g.id} className="game"><span className="game-no">#{todayGames.length-i}</span><div><span className="muted">勝者 </span><b className="positive">{g.winnerName}（+{g.points}PT）</b><span className="muted loser-label">敗者 </span><b>{g.loserName}</b></div><button className="trash" onClick={()=>setGames(old=>old.filter(x=>x.id!==g.id))}><Trash2 size={17}/></button></div>)}</div>
      </div>}

      {tab === "history" && <div className="history"><h2>日別成績</h2>{allDates.length===0 ? <div className="empty">まだ記録はありません</div> : allDates.map(d => <section key={d}><h3>{d}</h3><div className="stats">{statsForDate(d).map(s=><div key={s.id} className="stat-row"><b>{s.name}</b><span>{s.wins}勝 / {s.losses}敗</span><b className={s.points>0?"positive":s.points<0?"negative":""}>{signed(s.points)}pt</b></div>)}</div></section>)}</div>}

      {tab === "settings" && <div><section><h2>過去成績を追加</h2><p className="note">日付ごとに3人の勝敗数と合計POINTを入力します。</p><input className="date past-date" type="date" value={pastDate} onChange={e=>setPastDate(e.target.value)}/><div className="past-list">{PLAYERS.map(p=><div key={p.id} className="past-player"><b>{p.name}</b><div className="past-grid">{[["wins","勝"],["losses","敗"],["points","POINT"]].map(([field,label])=><label key={field}>{label}<input type="number" min={field!=="points"?"0":undefined} value={pastInput[p.id][field]} onChange={e=>setPastInput(old=>({...old,[p.id]:{...old[p.id],[field]:Number(e.target.value)}}))}/></label>)}</div></div>)}</div><div className={`sum ${pastPointTotal===0?"ok":"bad"}`}>3人のPOINT合計：{signed(pastPointTotal)}PT {pastPointTotal===0?"✓":"（0PTになるよう確認）"}</div><button disabled={pastPointTotal!==0} onClick={registerPast} className="save past-save">この日の過去成績を登録</button></section></div>}
    </main>
  </div>;
}
