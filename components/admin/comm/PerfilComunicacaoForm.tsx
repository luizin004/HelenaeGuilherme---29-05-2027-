"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { salvarPerfilComunicacao, type ActionState } from "@/app/actions/comm";
import type { GuestCommProfile, GuestVinculoContexto } from "@/lib/comm-data";
import {
  resolveGuestCommunicationTemperament,
  VINCULOS_PRINCIPAIS,
  TIPOS_VINCULO,
  NIVEIS_PROXIMIDADE,
  type VinculoPrincipal,
  type TipoVinculo,
  type NivelProximidade,
} from "@/domain/comm/temperament";
import { PAPEIS } from "@/domain/convites/caixas";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar perfil"}
    </button>
  );
}

function Txt({ name, label, def, ph }: { name: string; label: string; def?: string | null; ph?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={def ?? ""} placeholder={ph} className="field-input" />
    </div>
  );
}

function Chk({ name, label, def, onChange }: { name: string; label: string; def?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" name={name} defaultChecked={def ?? false} onChange={(e) => onChange?.(e.target.checked)} /> {label}
    </label>
  );
}

function Barra({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="font-medium text-moss">{label}</span>
        <span className="text-muted">{valor}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full bg-olive" style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function Chip({ children, tom = "moss" }: { children: React.ReactNode; tom?: "moss" | "success" | "warn" }) {
  const cores = { moss: "bg-[#eef1e6] text-moss", success: "bg-[#e6efe0] text-success", warn: "bg-[#f6ecd6] text-warn" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${cores[tom]}`}>{children}</span>;
}

const EMOJI_LABEL: Record<string, string> = { none: "sem emoji", low: "poucos emojis", moderate: "emojis moderados" };
const TAMANHO_LABEL: Record<string, string> = { short: "curta", medium: "média", complete: "completa e detalhada" };

export function PerfilComunicacaoForm({
  guestId,
  perfil,
  contexto,
  prazoRsvpProximo,
}: {
  guestId: string;
  perfil: GuestCommProfile | null;
  contexto: GuestVinculoContexto;
  prazoRsvpProximo: boolean;
}) {
  const [state, formAction] = useFormState(salvarPerfilComunicacao, initial);

  // ————— Vínculo e papel (combinação principal do temperamento)
  const [vinculoPrincipal, setVinculoPrincipal] = useState((perfil?.lado as VinculoPrincipal) ?? "");
  const [tipoVinculo, setTipoVinculo] = useState((perfil?.parentesco as TipoVinculo) ?? "");
  const [tipoVinculoOutro, setTipoVinculoOutro] = useState(perfil?.tipo_vinculo_outro ?? "");
  const [proximidade, setProximidade] = useState((perfil?.proximidade as NivelProximidade) ?? "moderado");
  const [papelCasamento, setPapelCasamento] = useState(contexto.papel ?? "convidado");

  // ————— Modificadores complementares
  const [pessoaIdosa, setPessoaIdosa] = useState(perfil?.pessoa_idosa ?? false);
  const [situacaoSensivel, setSituacaoSensivel] = useState(perfil?.situacao_sensivel ?? false);
  const [forcarAprovacao, setForcarAprovacao] = useState(perfil?.forcar_aprovacao ?? false);
  const [humorAutorizado, setHumorAutorizado] = useState(perfil?.humor_autorizado ?? false);
  const [apelido, setApelido] = useState(perfil?.apelido_autorizado ?? "");
  const [aceitaAudio, setAceitaAudio] = useState(perfil ? perfil.aceita_audio : true);
  const [cidadePartida, setCidadePartida] = useState(perfil?.cidade_partida ?? "");

  // ————— Personalização manual (perfil_bloqueado)
  const [perfilBloqueado, setPerfilBloqueado] = useState(perfil?.perfil_bloqueado ?? false);
  const [snapshot] = useState({ vinculoPrincipal, tipoVinculo, proximidade, papelCasamento });
  const [avisoRecalcularDispensado, setAvisoRecalcularDispensado] = useState(false);

  const mudouVinculo =
    snapshot.vinculoPrincipal !== vinculoPrincipal ||
    snapshot.tipoVinculo !== tipoVinculo ||
    snapshot.proximidade !== proximidade ||
    snapshot.papelCasamento !== papelCasamento;
  const mostrarAvisoRecalcular = perfilBloqueado && mudouVinculo && !avisoRecalcularDispensado;

  const sugestao = useMemo(
    () =>
      resolveGuestCommunicationTemperament({
        nome: contexto.nome,
        vinculoPrincipal: (vinculoPrincipal || null) as VinculoPrincipal | null,
        tipoVinculo: (tipoVinculo || null) as TipoVinculo | null,
        proximidade,
        papel: papelCasamento,
        status: (contexto.status as "confirmado" | "pendente" | "recusado" | null) ?? "pendente",
        prazoRsvpProximo,
        ehCrianca: contexto.ehCrianca,
        pessoaIdosa,
        outraCidade: Boolean(cidadePartida.trim()),
        contatoPrincipalFamilia: contexto.ehContatoPrincipal,
        situacaoSensivel,
        forcarAprovacao,
        apelidoAutorizado: apelido,
        humorAutorizado,
        aceitaAudio,
      }),
    [
      contexto.nome, contexto.status, contexto.ehCrianca, contexto.ehContatoPrincipal,
      vinculoPrincipal, tipoVinculo, proximidade, papelCasamento, prazoRsvpProximo,
      pessoaIdosa, cidadePartida, situacaoSensivel, forcarAprovacao, apelido, humorAutorizado, aceitaAudio,
    ],
  );

  const [manualTexto, setManualTexto] = useState({
    tom: perfil?.tom ?? "",
    formalidade: perfil?.formalidade ?? "",
    emocao: perfil?.emocao ?? "",
    humor: perfil?.humor ?? "",
    tamanho: perfil?.tamanho ?? "",
    tratamento: perfil?.tratamento ?? "",
  });

  const aceitarSugestao = () => {
    setPerfilBloqueado(false);
    setAvisoRecalcularDispensado(false);
    setManualTexto({ tom: "", formalidade: "", emocao: "", humor: "", tamanho: "", tratamento: "" });
  };
  const personalizar = () => setPerfilBloqueado(true);
  const restaurarPadrao = aceitarSugestao;

  // O que é efetivamente ENVIADO ao salvar: se não bloqueado, sempre a sugestão
  // fresca (recalcula sozinho); se bloqueado, o texto manual do operador.
  const envio = perfilBloqueado
    ? manualTexto
    : {
        tom: sugestao.sugestaoTexto.tom,
        formalidade: sugestao.sugestaoTexto.formalidade,
        emocao: sugestao.sugestaoTexto.tom,
        humor: sugestao.sugestaoTexto.humor,
        tamanho: sugestao.sugestaoTexto.tamanho,
        tratamento: sugestao.sugestaoTexto.tratamento,
      };

  const exemploMensagem = `${envio.tratamento === "senhor(a)" ? "Prezado(a)" : `Oi${apelido ? `, ${apelido}` : contexto.nome ? `, ${contexto.nome.split(" ")[0]}` : ""}`}! ${
    contexto.status === "confirmado"
      ? "Ficamos muito felizes com a sua presença confirmada no nosso casamento."
      : "Contamos com você no nosso casamento e adoraríamos saber se poderá vir."
  }${sugestao.emojiLevel !== "none" ? " 💛" : ""}`;

  return (
    <form action={formAction} className="grid gap-6 p-6">
      <input type="hidden" name="guest_id" value={guestId} />
      <input type="hidden" name="nome_convidado" value={contexto.nome} />
      <input type="hidden" name="papel_casamento" value={papelCasamento} />
      <input type="hidden" name="lado" value={vinculoPrincipal} />
      <input type="hidden" name="parentesco" value={tipoVinculo} />
      <input type="hidden" name="tipo_vinculo_outro" value={tipoVinculo === "outro" ? tipoVinculoOutro : ""} />
      <input type="hidden" name="proximidade" value={proximidade} />
      <input type="hidden" name="perfil_bloqueado" value={perfilBloqueado ? "on" : ""} />
      <input type="hidden" name="tom" value={envio.tom} />
      <input type="hidden" name="formalidade" value={envio.formalidade} />
      <input type="hidden" name="emocao" value={envio.emocao} />
      <input type="hidden" name="humor" value={envio.humor} />
      <input type="hidden" name="tamanho" value={envio.tamanho} />
      <input type="hidden" name="tratamento" value={envio.tratamento} />
      <input type="hidden" name="pessoa_idosa" value={pessoaIdosa ? "on" : ""} />
      <input type="hidden" name="situacao_sensivel" value={situacaoSensivel ? "on" : ""} />
      <input type="hidden" name="forcar_aprovacao" value={forcarAprovacao ? "on" : ""} />
      <input type="hidden" name="humor_autorizado" value={humorAutorizado ? "on" : ""} />

      <fieldset className="grid gap-4 rounded-lg border border-line bg-ivory p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="mb-1 px-1 text-xs uppercase tracking-wide text-muted">Vínculo e forma de comunicação</legend>
        <div className="flex flex-col gap-1">
          <label className="field-label">Vínculo principal com</label>
          <select value={vinculoPrincipal} onChange={(e) => setVinculoPrincipal(e.target.value as VinculoPrincipal)} className="field-input">
            <option value="">Selecionar…</option>
            {VINCULOS_PRINCIPAIS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Tipo de vínculo</label>
          <select value={tipoVinculo} onChange={(e) => setTipoVinculo(e.target.value as TipoVinculo)} className="field-input">
            <option value="">Selecionar…</option>
            {TIPOS_VINCULO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {tipoVinculo === "outro" && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="field-label">Descreva o vínculo</label>
            <input value={tipoVinculoOutro} onChange={(e) => setTipoVinculoOutro(e.target.value)} placeholder="Ex.: madrinha de batismo, dupla de padrinhos de crisma…" className="field-input" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="field-label">Nível de proximidade</label>
          <select value={proximidade} onChange={(e) => setProximidade(e.target.value as NivelProximidade)} className="field-input">
            {NIVEIS_PROXIMIDADE.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Papel no casamento</label>
          <select value={papelCasamento} onChange={(e) => setPapelCasamento(e.target.value)} className="field-input">
            {PAPEIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <Txt name="nome_preferido" label="Nome preferido" def={perfil?.nome_preferido} />
        <div className="flex flex-col gap-1">
          <label className="field-label">Apelido autorizado</label>
          <input name="apelido_autorizado" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="só se for autorizado" className="field-input" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Cidade de partida</label>
          <input name="cidade_partida" value={cidadePartida} onChange={(e) => setCidadePartida(e.target.value)} placeholder="preenchido = vem de outra cidade" className="field-input" />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
          <Chk name="_pessoa_idosa_ui" label="Pessoa idosa" def={pessoaIdosa} onChange={setPessoaIdosa} />
          <Chk name="_situacao_sensivel_ui" label="Situação sensível" def={situacaoSensivel} onChange={setSituacaoSensivel} />
          <Chk name="_forcar_aprovacao_ui" label="Exigir aprovação humana" def={forcarAprovacao} onChange={setForcarAprovacao} />
          <Chk name="_humor_autorizado_ui" label="Humor autorizado" def={humorAutorizado} onChange={setHumorAutorizado} />
          {contexto.ehContatoPrincipal && <Chip tom="success">contato principal da família</Chip>}
        </div>
      </fieldset>

      {mostrarAvisoRecalcular && (
        <div className="rounded-lg border border-warn/40 bg-[#f6ecd6] p-4">
          <p className="mb-2 text-sm text-moss">
            O vínculo foi alterado. O perfil de comunicação estava <strong>personalizado</strong> — deseja recalcular?
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setAvisoRecalcularDispensado(true)} className="btn btn-outline text-xs">Manter perfil atual</button>
            <button type="button" onClick={aceitarSugestao} className="btn btn-dark text-xs">Recalcular sugestão</button>
          </div>
        </div>
      )}

      <fieldset className="grid gap-4 rounded-lg border border-line bg-white p-4">
        <legend className="mb-1 px-1 text-xs uppercase tracking-wide text-muted">Temperamento sugerido</legend>
        <p className="text-sm italic text-muted">{sugestao.reasoningSummary}</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Barra label="Formalidade" valor={sugestao.formality} />
          <Barra label="Afeto" valor={sugestao.affection} />
          <Barra label="Objetividade" valor={sugestao.objectivity} />
          <Barra label="Humor" valor={sugestao.humor} />
          <Barra label="Urgência" valor={sugestao.urgency} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip>{EMOJI_LABEL[sugestao.emojiLevel]}</Chip>
          <Chip>mensagem {TAMANHO_LABEL[sugestao.messageLength]}</Chip>
          <Chip tom={sugestao.allowNickname ? "success" : "moss"}>{sugestao.allowNickname ? "apelido permitido" : "sem apelido"}</Chip>
          <Chip tom={sugestao.allowAudio ? "success" : "moss"}>{sugestao.allowAudio ? "áudio permitido" : "sem áudio"}</Chip>
          {sugestao.requiresApproval && <Chip tom="warn">exige aprovação humana</Chip>}
          {perfilBloqueado && <Chip tom="warn">perfil personalizado</Chip>}
        </div>

        {sugestao.toneInstructions.length > 0 && (
          <div className="text-xs text-muted">
            <p className="mb-1 font-medium text-moss">Como abordar</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {sugestao.toneInstructions.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
        {sugestao.avoidInstructions.length > 0 && (
          <div className="text-xs text-muted">
            <p className="mb-1 font-medium text-danger">Evitar</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {sugestao.avoidInstructions.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        <div className="rounded-md bg-ivory p-3 text-sm text-moss">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted">Exemplo de mensagem</p>
          “{exemploMensagem}”
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!perfilBloqueado ? (
            <button type="button" onClick={personalizar} className="btn btn-outline text-xs">Personalizar</button>
          ) : (
            <>
              <span className="text-xs text-warn">Perfil personalizado — não recalcula sozinho.</span>
              <button type="button" onClick={restaurarPadrao} className="btn btn-outline text-xs">Restaurar sugestão automática</button>
            </>
          )}
        </div>

        {perfilBloqueado && (
          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
            <Txt name="_tom_manual" label="Tom (personalizado)" def={manualTexto.tom} ph={sugestao.sugestaoTexto.tom} />
            <Txt name="_formalidade_manual" label="Formalidade (personalizada)" def={manualTexto.formalidade} ph={sugestao.sugestaoTexto.formalidade} />
            <Txt name="_tratamento_manual" label="Tratamento (personalizado)" def={manualTexto.tratamento} ph={sugestao.sugestaoTexto.tratamento} />
            {/* Os inputs acima só orientam visualmente — os valores realmente
                enviados ficam nos campos ocultos, atualizados abaixo. */}
            <div className="sm:col-span-3 flex flex-wrap gap-3">
              {(["tom", "formalidade", "tratamento", "humor", "tamanho"] as const).map((campo) => (
                <label key={campo} className="flex flex-col gap-1 text-xs text-muted">
                  {campo}
                  <input
                    value={manualTexto[campo]}
                    onChange={(e) => setManualTexto((m) => ({ ...m, [campo]: e.target.value }))}
                    placeholder={sugestao.sugestaoTexto[campo === "formalidade" ? "formalidade" : campo]}
                    className="field-input py-1 text-xs"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-xs uppercase tracking-wide text-muted">Relação e histórico autorizado</legend>
        <Txt name="relacao_helena" label="Relação com Helena" def={perfil?.relacao_helena} />
        <Txt name="relacao_guilherme" label="Relação com Guilherme" def={perfil?.relacao_guilherme} />
        <Txt name="relacao_ambos" label="Relação com o casal" def={perfil?.relacao_ambos} />
        <Txt name="canal_preferido" label="Canal preferido" def={perfil?.canal_preferido} ph="whatsapp, email, áudio" />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">História autorizada</label>
          <textarea name="historia_autorizada" defaultValue={perfil?.historia_autorizada ?? ""} rows={2} className="field-input" placeholder="Só o que a pessoa autorizou mencionar" />
        </div>
        <Txt name="assuntos_permitidos" label="Assuntos permitidos" def={perfil?.assuntos_permitidos} />
        <Txt name="assuntos_proibidos" label="Assuntos proibidos" def={perfil?.assuntos_proibidos} />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-xs uppercase tracking-wide text-muted">Consentimento</legend>
        <Chk name="aceita_whatsapp" label="Aceita WhatsApp" def={perfil ? perfil.aceita_whatsapp : true} />
        <Chk name="aceita_email" label="Aceita e-mail" def={perfil ? perfil.aceita_email : true} />
        <Chk name="aceita_audio" label="Aceita áudio" def={perfil ? perfil.aceita_audio : true} onChange={setAceitaAudio} />
        <Chk name="aceita_lembretes" label="Aceita lembretes opcionais" def={perfil ? perfil.aceita_lembretes : true} />
        <Chk name="precisa_hospedagem" label="Precisa de hospedagem" def={perfil?.precisa_hospedagem ?? false} />
        <Chk name="herdar_familia" label="Herdar contexto da família" def={perfil ? perfil.herdar_familia : true} />
        <Chk name="opt_out" label="Não enviar (opt-out)" def={perfil?.opt_out ?? false} />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="field-label">Observação</label>
        <textarea name="observacao" defaultValue={perfil?.observacao ?? ""} rows={2} className="field-input" />
      </div>

      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
