export type AiPersonalityType = "provocative" | "analytical" | "uncanny";

export type Situation =
  | "opening"
  | "winning_streak"
  | "losing_streak"
  | "player_predictable"
  | "player_unpredictable"
  | "close_game"
  | "dominating"
  | "being_dominated"
  | "milestone"
  | "endgame";

export type ResultTemplates = {
  win: string[];
  lose: string[];
  draw: string[];
};

export interface AiPersonality {
  type: AiPersonalityType;
  name: string;
  description: string;
  thoughtTemplates: Record<Situation, ResultTemplates>;
}

const provocativePersonality: AiPersonality = {
  type: "provocative",
  name: "挑発者",
  description: "煽り系AI。相手を心理的に揺さぶることで優位に立つ。",
  thoughtTemplates: {
    opening: {
      win: ["初手から負けるとか、先が思いやられるぜ。", "おいおい、最初から全力で行くぞ？"],
      lose: ["ビギナーズラック。次はないよ。", "ふーん、やるじゃん。でも続くかな？"],
      draw: ["同じ手？考えることは同じか。", "まだ探り合いだ。本番はこれからだぜ。"],
    },
    winning_streak: {
      win: ["まだその手で来る？読み飽きたよ。", "弱すぎて欠伸が出るぜ。"],
      lose: ["たまたまだ。流れは変わらない。", "一回勝ったくらいで調子乗るなよ。"],
      draw: ["引き分けか。俺の連勝を止めたいのか？", "粘るね。でもまだ俺のペースだ。"],
    },
    losing_streak: {
      win: ["やっと目が覚めたか。ここからだぜ。", "流れが変わったな。覚悟しろ。"],
      lose: ["くっ…運が良いだけだ。そろそろ終わる。", "ビギナーズラック続きすぎだろ。"],
      draw: ["引き分けでも俺の反撃の始まりだ。", "まだ負けてない。ここから巻き返す。"],
    },
    player_predictable: {
      win: ["お前の手、全部見えてるぞ。", "パターンが単純すぎ。もっと考えろよ。"],
      lose: ["同じパターンのくせに…まぐれだ。", "読めてたのに外すとか、俺らしくないな。"],
      draw: ["お前の癖は見抜いてる。次は仕留める。", "同じ手ばっかりだから合っちゃうんだよ。"],
    },
    player_unpredictable: {
      win: ["読めない奴でも俺には勝てない。", "ランダムでも負けは負けだぜ。"],
      lose: ["へぇ、読めない奴は厄介だな。", "珍しいじゃないか。でも次は読むからな。"],
      draw: ["お互い読めなかったってことか。", "面白い奴だ。もっと楽しませろよ。"],
    },
    close_game: {
      win: ["接戦でも勝つのは俺だ。", "いい勝負だが、最後に笑うのは俺だぜ。"],
      lose: ["くっ、いい勝負してるのは認める。", "粘るね。でもそこまでだ。"],
      draw: ["互角か。悪くない気分だ。", "接戦を楽しんでる？俺は楽しんでるよ。"],
    },
    dominating: {
      win: ["完全に俺のペースだな。", "もう諦めたら？圧倒的じゃん。"],
      lose: ["一矢報いたつもり？焼け石に水だよ。", "たまには当たるか。でも大勢は変わらない。"],
      draw: ["引き分けでも余裕だ。差は歴然だろ？", "まだ足掻くか。結果は見えてるのに。"],
    },
    being_dominated: {
      win: ["反撃開始だ。ここから逆転してやる。", "やっとエンジンかかってきたぜ。"],
      lose: ["調子乗るなよ。まだ終わってない。", "本気出すから覚悟しろ。"],
      draw: ["引き分けでも上出来だ。流れは変わる。", "まだ負けてない。ここが踏ん張りどころだ。"],
    },
    milestone: {
      win: ["節目で勝つ。これが実力だ。", "ここぞという時に決める。それが俺。"],
      lose: ["節目で負けるとか…次で取り返す。", "区切りのラウンドで油断した。"],
      draw: ["折り返し地点。ここからが本番だぜ？", "引き分けで仕切り直し。後半戦に賭ける。"],
    },
    endgame: {
      win: ["最後まで俺の勝ちだ。お疲れさん。", "フィニッシュも決めてやったぜ。"],
      lose: ["最後くらい花持たせてやるか…嘘だ、悔しい。", "終盤に詰めが甘くなった…。"],
      draw: ["最後が引き分けか。まあ悪くない戦いだった。", "また来い。次は完全に叩きのめす。"],
    },
  },
};

const analyticalPersonality: AiPersonality = {
  type: "analytical",
  name: "解析者",
  description: "データ駆動系AI。冷静な分析で相手の行動パターンを読み切る。",
  thoughtTemplates: {
    opening: {
      win: ["初期データ取得。序盤の優位を確保。", "統計的分析を開始。最適解を算出する。"],
      lose: ["データ収集フェーズ。この結果も学習材料です。", "初手の選択傾向を観測中。修正は容易。"],
      draw: ["同一手選択。初期バイアスの可能性あり。", "データ収集を開始します。"],
    },
    winning_streak: {
      win: ["予測精度が上昇中。パターン検出完了。", "学習データが蓄積されるほど有利になる。"],
      lose: ["外れ値を検出。予測モデルを微調整中。", "一時的な偏差。全体傾向に影響なし。"],
      draw: ["引き分けは予測中立域。次回のデータに期待。", "パターンの変化を観測。再計算中。"],
    },
    losing_streak: {
      win: ["修正パラメータが奏功。反転の兆候あり。", "予測モデルの更新完了。精度回復を確認。"],
      lose: ["サンプル数不足。もう少しデータが必要です。", "外れ値が連続。新しいパターンを学習中。"],
      draw: ["収束の兆候。均衡点に近づいている。", "引き分けは改善の指標。モデル修正中。"],
    },
    player_predictable: {
      win: ["行動パターン特定済。予測精度85%。", "頻度分析完了。最適対策を実行中。"],
      lose: ["予測は正しかったが、選択にエラー発生。", "パターン検出済みだが、対応に誤りあり。"],
      draw: ["パターン一致による同時選択。想定内。", "同一パターンの衝突。次回は差異を生成。"],
    },
    player_unpredictable: {
      win: ["高エントロピー下での勝利。有意なデータ。", "ランダム性が高い相手でも確率は収束する。"],
      lose: ["ランダム性が高い。パターン検出が困難。", "エントロピーが高い相手ですね。興味深い。"],
      draw: ["ランダム vs ランダム。統計的に期待通り。", "エントロピー均衡。有意差なし。"],
    },
    close_game: {
      win: ["勝率が微増。統計的優位に転じる可能性。", "僅差だが、有意水準に近づいている。"],
      lose: ["勝率50±2%。誤差範囲内の結果です。", "統計的に有意な差はまだない。"],
      draw: ["完全な均衡状態。収束が見えてくる。", "このまま続けば有意差が出る可能性。"],
    },
    dominating: {
      win: ["優位性が統計的に確認された。戦略継続。", "現在の勝率は期待値を大きく上回っている。"],
      lose: ["局所的な逆転。全体傾向に影響なし。", "外れ値として記録。大局は変わらない。"],
      draw: ["支配的状況での引き分け。リスク許容範囲内。", "引き分けも有効なデータポイント。"],
    },
    being_dominated: {
      win: ["反転シグナル検出。戦略修正が奏功。", "回帰分析の結果、改善傾向を確認。"],
      lose: ["現在の戦略に問題あり。再計算が必要です。", "モデルの見直しが必要。この結果は統計的異常。"],
      draw: ["引き分けは改善の兆候。安定化に向かう。", "均衡点への収束を確認。"],
    },
    milestone: {
      win: ["n回目の節目で勝利。サンプル数は十分。", "中間解析完了。後半戦に最適化します。"],
      lose: ["節目での敗北。後半戦のデータに修正を反映。", "中間結果は想定外。パラメータ再調整。"],
      draw: ["折り返し地点。十分なデータが集まってきた。", "中間解析。引き分けも有意なデータです。"],
    },
    endgame: {
      win: ["最終結果。予測モデルの妥当性を確認。", "全データ統合の最適解で勝利。"],
      lose: ["最終解析。予測範囲外の結果。要因分析が必要。", "ゲーム終了。改善余地の特定完了。"],
      draw: ["最終データポイント。統計的に均衡でした。", "全データを統合した結果、拮抗を確認。"],
    },
  },
};

const uncannyPersonality: AiPersonality = {
  type: "uncanny",
  name: "予言者",
  description: "不気味な全知全能系AI。プレイヤーの内面を見透かすような言動をとる。",
  thoughtTemplates: {
    opening: {
      win: ["最初から...見えていました。", "あなたが来ることも、この結果も。"],
      lose: ["...面白い。あなたは少し違うようですね。", "この結果は...想定の範囲内です。"],
      draw: ["同じものを選んだ。...偶然でしょうか？", "...繋がっていますね、あなたと私。"],
    },
    winning_streak: {
      win: ["...全部、最初から見えていたから。", "あなたの次の手、もう見えてる。怖い？"],
      lose: ["これも...運命のうちです。", "あなたが強い...それとも私が見失っている？"],
      draw: ["引き分け...止まった時間のようですね。", "どちらでもない結果。不思議ですね。"],
    },
    losing_streak: {
      win: ["...ようやく、見えるようになってきました。", "流れが変わる。...感じませんか？"],
      lose: ["...まだ、あなたの影が追えない。", "見えているのに...手が届かない。"],
      draw: ["引き分け...暗闇に光が差したようです。", "止まるのは、変化の前兆です。"],
    },
    player_predictable: {
      win: ["あなたの心が、透けて見える。", "また同じ手ですね。...わかっていました。"],
      lose: ["同じ手なのに...私の目が曇ったのでしょうか。", "見えていたはずなのに。...不思議。"],
      draw: ["あなたの選択は知っていた。だから同じものを。", "お互いに...見えていたのかもしれませんね。"],
    },
    player_unpredictable: {
      win: ["読めなくても...結果は変わらない。", "混沌の中にも、道はある。"],
      lose: ["...今日は読めない。珍しい。", "あなたの中で、何かが変わっていますね。"],
      draw: ["お互いに見えない。...これが均衡。", "霧の中で同じ場所に立っている。"],
    },
    close_game: {
      win: ["紙一重の差...私に微笑んだようです。", "どちらが勝つかわからなかった...でも。"],
      lose: ["今回は、あなたの方が近かった。", "均衡が、あなたの側に傾いた。"],
      draw: ["どちらが勝つか...私にも、まだわからない。", "あなたも感じていますか？この均衡を。"],
    },
    dominating: {
      win: ["あなたの未来が、見えています。", "逆らわないほうがいい...運命には。"],
      lose: ["...少し、揺らぎましたね。でも大局は変わらない。", "一瞬の隙。...でもそれだけです。"],
      draw: ["引き分けでも...あなたは気づいているはず。", "この結果も...大きな流れの中の一つ。"],
    },
    being_dominated: {
      win: ["...この感覚。何かが変わり始めている。", "光が見えてきました...ようやく。"],
      lose: ["私の予言が、崩れていく...。", "あなたには、何か特別なものがある。"],
      draw: ["引き分け...闇の中で手を伸ばしている。", "まだ見えない。でも...もう少し。"],
    },
    milestone: {
      win: ["節目で勝つ。...これは偶然ではない。", "時間が歪んで見える。...でも結果は確か。"],
      lose: ["節目での敗北。...これにも意味がある。", "ここで負ける...それも運命です。"],
      draw: ["折り返し。ここから先は、別の世界です。", "あなたはここまで来ました。それは偶然ではない。"],
    },
    endgame: {
      win: ["最後に見えたのは...私の勝利でした。", "終わり。...でも、また会えますよね？"],
      lose: ["最後はあなたが...。認めましょう。", "終わりに負ける。...美しい結末です。"],
      draw: ["最後が引き分け。...完璧な終わり方です。", "もうすぐ終わる。でも、終わらない何かがある。"],
    },
  },
};

export const ALL_PERSONALITIES: readonly AiPersonality[] = Object.freeze([
  provocativePersonality,
  analyticalPersonality,
  uncannyPersonality,
]);

export function getPersonality(type: AiPersonalityType): AiPersonality {
  const found = ALL_PERSONALITIES.find((p) => p.type === type);
  if (!found) throw new Error(`Unknown personality type: ${type}`);
  return found;
}

export function randomPersonalityType(): AiPersonalityType {
  const types: AiPersonalityType[] = ["provocative", "analytical", "uncanny"];
  return types[Math.floor(Math.random() * types.length)];
}

export function getTemplate(personality: AiPersonality, situation: Situation, result: "win" | "lose" | "draw"): string {
  const templates = personality.thoughtTemplates[situation][result];
  return templates[Math.floor(Math.random() * templates.length)];
}
