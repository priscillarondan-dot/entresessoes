
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Brain, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";

function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateMessages(theme: string, triggers: string, goal: string, exercises: string) {
  const t = theme || "seu processo terapêutico";
  const g = triggers || "situações difíceis";
  const meta = goal || "observar seus pensamentos com mais gentileza";
  const ex = exercises || "respirar fundo e registrar o que sentiu";

  return [
    `Hoje, observe ${g} sem se julgar. Sua tarefa não é controlar tudo, é perceber o que acontece dentro de você.`,
    `Quando o gatilho aparecer, lembre-se do objetivo da semana: ${meta}. Um passo pequeno já conta.`,
    `Antes de reagir, faça uma pausa de 30 segundos. Pergunte-se: "isso é fato ou interpretação?"`,
    `Você não precisa vencer todos os pensamentos hoje. Só precisa notar um deles e escolher uma resposta mais cuidadosa.`,
    `Se a ansiedade aumentar, pratique: ${ex}. Depois, registre como seu corpo ficou.`,
    `Seu valor não depende da reação das outras pessoas. Volte para o que está sob seu controle agora.`,
    `Relembre o tema trabalhado: ${t}. O que você percebeu em si hoje que antes passaria despercebido?`,
    `Não transforme um momento difícil em uma sentença sobre você. É só um momento. Respire e retome.`,
    `Hoje, procure uma evidência real antes de acreditar automaticamente no pensamento que surgiu.`,
    `Cada registro é parte da sua evolução. Mesmo os dias difíceis também ensinam algo importante.`
  ];
}

export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [portalPatient, setPortalPatient] = useState<any>(null);
  const [portalMessages, setPortalMessages] = useState<any[]>([]);

  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [patient, setPatient] = useState({ name: "", email: "", phone: "", objective: "" });
  const [session, setSession] = useState({ theme: "", triggers: "", weekly_goal: "", exercises: "", notes: "" });
  const [accessCode, setAccessCode] = useState("");
  const [checkin, setCheckin] = useState({ mood: "4", note: "" });

  useEffect(() => {
    const saved = localStorage.getItem("entresessoes_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setScreen("dashboard");
      loadPatients(parsed.id);
    }
  }, []);

  async function loginOrRegister() {
    if (!auth.email || !auth.password) return alert("Preencha e-mail e senha.");

    if (mode === "register") {
      if (!auth.name) return alert("Preencha seu nome.");
      const { data, error } = await supabase.from("psychologists").insert({
        name: auth.name,
        email: auth.email.toLowerCase(),
        password: auth.password
      }).select().single();
      if (error) return alert(error.message);
      localStorage.setItem("entresessoes_user", JSON.stringify(data));
      setUser(data);
      setScreen("dashboard");
      loadPatients(data.id);
      return;
    }

    const { data, error } = await supabase.from("psychologists")
      .select("*")
      .eq("email", auth.email.toLowerCase())
      .eq("password", auth.password)
      .single();

    if (error || !data) return alert("Login inválido.");
    localStorage.setItem("entresessoes_user", JSON.stringify(data));
    setUser(data);
    setScreen("dashboard");
    loadPatients(data.id);
  }

  function logout() {
    localStorage.removeItem("entresessoes_user");
    setUser(null);
    setScreen("landing");
  }

  async function loadPatients(id = user?.id) {
    if (!id) return;
    const { data } = await supabase.from("patients").select("*").eq("psychologist_id", id).order("created_at", { ascending: false });
    setPatients(data || []);
  }

  async function createPatient() {
    if (!patient.name) return alert("Informe o nome do paciente.");
    const { error } = await supabase.from("patients").insert({
      ...patient,
      psychologist_id: user.id,
      access_code: code()
    });
    if (error) return alert(error.message);
    setPatient({ name: "", email: "", phone: "", objective: "" });
    await loadPatients();
    alert("Paciente cadastrado.");
  }

  async function createSession() {
    if (!selected || !session.theme) return alert("Selecione o paciente e informe o tema principal.");
    const { data, error } = await supabase.from("therapy_sessions").insert({
      patient_id: selected.id,
      psychologist_id: user.id,
      ...session
    }).select().single();
    if (error) return alert(error.message);

    const generated = generateMessages(session.theme, session.triggers, session.weekly_goal, session.exercises);
    const periods = ["Segunda manhã","Segunda tarde","Terça manhã","Terça tarde","Quarta manhã","Quarta tarde","Quinta manhã","Quinta tarde","Sexta manhã","Sexta tarde"];
    const payload = generated.map((m, i) => ({
      patient_id: selected.id,
      session_id: data.id,
      message: m,
      scheduled_period: periods[i]
    }));
    const { data: inserted, error: msgError } = await supabase.from("support_messages").insert(payload).select();
    if (msgError) return alert(msgError.message);
    setMessages(inserted || []);
    alert("Acompanhamento gerado.");
  }

  async function viewProgress(p: any) {
    setSelected(p);
    const { data: checkins } = await supabase.from("patient_checkins").select("*").eq("patient_id", p.id);
    const { data: msgs } = await supabase.from("support_messages").select("*").eq("patient_id", p.id);
    const avg = checkins?.length ? (checkins.reduce((a: number, c: any) => a + Number(c.mood), 0) / checkins.length).toFixed(1) : "Sem dados";
    const total = msgs?.length || 0;
    const completed = msgs?.filter((m: any) => m.completed).length || 0;
    const engagement = total ? Math.round((completed / total) * 100) : 0;
    setProgress({ avg, total, completed, engagement, checkins: checkins || [] });
  }

  async function openPortal() {
    const { data, error } = await supabase.from("patients").select("*").eq("access_code", accessCode.toUpperCase()).single();
    if (error || !data) return alert("Código não encontrado.");
    setPortalPatient(data);
    const { data: msgs } = await supabase.from("support_messages").select("*").eq("patient_id", data.id).order("created_at", { ascending: false });
    setPortalMessages(msgs || []);
  }

  async function saveCheckin() {
    if (!portalPatient) return;
    const { error } = await supabase.from("patient_checkins").insert({
      patient_id: portalPatient.id,
      mood: Number(checkin.mood),
      note: checkin.note
    });
    if (error) return alert(error.message);
    setCheckin({ mood: "4", note: "" });
    alert("Check-in salvo.");
  }

  async function completeMessage(id: string) {
    await supabase.from("support_messages").update({ completed: true }).eq("id", id);
    openPortal();
  }

  return (
    <>
      <header className="header">
        <div className="logo">EntreSessões</div>
        <div className="row">
          <button className="light" onClick={() => setScreen("portal")}>Portal do paciente</button>
          {user && <button className="secondary" onClick={logout}>Sair</button>}
        </div>
      </header>

      <main className="container">
        {screen === "landing" && (
          <section className="hero">
            <div className="badge"><Sparkles size={15}/> Terapia contínua entre sessões</div>
            <h1>Ajude seus pacientes a continuarem evoluindo depois da consulta.</h1>
            <p>Uma plataforma para psicólogos acompanharem check-ins emocionais, exercícios, mensagens de reforço e risco de abandono.</p>
            <div className="row" style={{justifyContent:"center"}}>
              <button onClick={() => {setMode("register"); setScreen("auth")}}>Criar conta</button>
              <button className="secondary" onClick={() => {setMode("login"); setScreen("auth")}}>Entrar</button>
            </div>
            <div className="grid" style={{marginTop:32, textAlign:"left"}}>
              <div className="card"><Brain/><h3>Registro pós-sessão</h3><p className="small">Tema, gatilhos, meta da semana e exercícios combinados.</p></div>
              <div className="card"><HeartPulse/><h3>Check-in emocional</h3><p className="small">O paciente registra humor e evolução durante a semana.</p></div>
              <div className="card"><ShieldCheck/><h3>Não substitui terapia</h3><p className="small">A plataforma apenas reforça orientações do profissional.</p></div>
            </div>
          </section>
        )}

        {screen === "auth" && (
          <section className="grid">
            <div className="card">
              <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
              {mode === "register" && <input placeholder="Seu nome" value={auth.name} onChange={e=>setAuth({...auth, name:e.target.value})}/>}
              <input placeholder="E-mail" value={auth.email} onChange={e=>setAuth({...auth, email:e.target.value})}/>
              <input placeholder="Senha" type="password" value={auth.password} onChange={e=>setAuth({...auth, password:e.target.value})}/>
              <button onClick={loginOrRegister}>Continuar</button>
              <p className="small">
                {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
                <a href="#" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </a>
              </p>
            </div>
          </section>
        )}

        {screen === "dashboard" && user && (
          <section>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div>
                <h1>Painel do Psicólogo</h1>
                <p className="small">Bem-vinda, {user.name}</p>
              </div>
            </div>

            <div className="grid">
              <div className="card">
                <h2>Novo paciente</h2>
                <input placeholder="Nome" value={patient.name} onChange={e=>setPatient({...patient, name:e.target.value})}/>
                <input placeholder="E-mail" value={patient.email} onChange={e=>setPatient({...patient, email:e.target.value})}/>
                <input placeholder="WhatsApp" value={patient.phone} onChange={e=>setPatient({...patient, phone:e.target.value})}/>
                <textarea placeholder="Objetivo terapêutico" value={patient.objective} onChange={e=>setPatient({...patient, objective:e.target.value})}/>
                <button onClick={createPatient}>Cadastrar</button>
              </div>

              <div className="card">
                <h2>Pacientes</h2>
                {patients.length === 0 && <p className="small">Nenhum paciente cadastrado ainda.</p>}
                {patients.map(p => (
                  <div className="message" key={p.id}>
                    <b>{p.name}</b> <span className="badge">Código: {p.access_code}</span>
                    <p className="small">{p.objective}</p>
                    <div className="row">
                      <button className="light" onClick={() => setSelected(p)}>Registrar sessão</button>
                      <button className="secondary" onClick={() => viewProgress(p)}>Ver evolução</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <div className="grid" style={{marginTop:16}}>
                <div className="card">
                  <h2>Registro pós-sessão</h2>
                  <p className="small">Paciente: {selected.name}</p>
                  <input placeholder="Tema principal. Ex: ansiedade profissional" value={session.theme} onChange={e=>setSession({...session, theme:e.target.value})}/>
                  <textarea placeholder="Gatilhos identificados" value={session.triggers} onChange={e=>setSession({...session, triggers:e.target.value})}/>
                  <textarea placeholder="Meta da semana" value={session.weekly_goal} onChange={e=>setSession({...session, weekly_goal:e.target.value})}/>
                  <textarea placeholder="Exercícios combinados" value={session.exercises} onChange={e=>setSession({...session, exercises:e.target.value})}/>
                  <textarea placeholder="Observações internas" value={session.notes} onChange={e=>setSession({...session, notes:e.target.value})}/>
                  <button onClick={createSession}>Gerar mensagens da semana</button>
                </div>

                <div className="card">
                  <h2>Evolução</h2>
                  {!progress && <p className="small">Clique em “Ver evolução” em um paciente.</p>}
                  {progress && (
                    <>
                      <p><b>Humor médio:</b> {progress.avg}</p>
                      <p><b>Mensagens concluídas:</b> {progress.completed}/{progress.total}</p>
                      <div className="progress"><div className="bar" style={{width:`${progress.engagement}%`}}></div></div>
                      <p className="small">Engajamento: {progress.engagement}%</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="card" style={{marginTop:16}}>
                <h2>Mensagens geradas</h2>
                {messages.map(m => <div className="message" key={m.id}>{m.message}<br/><span className="small">{m.scheduled_period}</span></div>)}
              </div>
            )}
          </section>
        )}

        {screen === "portal" && (
          <section>
            <div className="card">
              <h1>Portal do Paciente</h1>
              <p className="small">Digite o código recebido do seu psicólogo.</p>
              <input placeholder="Código de acesso" value={accessCode} onChange={e=>setAccessCode(e.target.value)}/>
              <button onClick={openPortal}>Acessar</button>
            </div>

            {portalPatient && (
              <div className="grid" style={{marginTop:16}}>
                <div className="card">
                  <h2>Olá, {portalPatient.name}</h2>
                  <label>Como você está hoje?</label>
                  <select value={checkin.mood} onChange={e=>setCheckin({...checkin, mood:e.target.value})}>
                    <option value="5">Excelente</option>
                    <option value="4">Bem</option>
                    <option value="3">Neutro</option>
                    <option value="2">Mal</option>
                    <option value="1">Muito mal</option>
                  </select>
                  <textarea placeholder="Quer registrar algo?" value={checkin.note} onChange={e=>setCheckin({...checkin, note:e.target.value})}/>
                  <button onClick={saveCheckin}>Salvar check-in</button>
                </div>

                <div className="card">
                  <h2>Reflexões da semana</h2>
                  {portalMessages.length === 0 && <p className="small">Nenhuma mensagem disponível ainda.</p>}
                  {portalMessages.map(m => (
                    <div className="message" key={m.id}>
                      {m.message}<br/>
                      <span className="small">{m.scheduled_period}</span><br/>
                      {m.completed ? <span className="badge">Concluída</span> : <button className="light" onClick={()=>completeMessage(m.id)}>Marcar como feita</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
