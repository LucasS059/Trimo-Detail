import { obterLojaLogadaId } from "@/lib/actions/auth";

export type ActionResponse<T = void> =
  | { sucesso: true; dados?: T }
  | { sucesso: false; erro: string };

/**
 * Wrapper de controle para ações administrativas autenticadas.
 */
export async function actionAutenticada<T>(
  callback: (lojaId: string) => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const lojaId = await obterLojaLogadaId();
    if (!lojaId) {
      return { sucesso: false, erro: "Sessão expirada. Faça login novamente." };
    }
    const dados = await callback(lojaId);
    return { sucesso: true, dados };
  } catch (error: any) {
    console.error("[Action Error]:", error);
    return { sucesso: false, erro: error.message || "Ocorreu um erro interno." };
  }
}

/**
 * Wrapper de controle para ações públicas de clientes.
 */
export async function actionPublica<T>(
  callback: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const dados = await callback();
    return { sucesso: true, dados };
  } catch (error: any) {
    console.error("[Public Action Error]:", error);
    return { sucesso: false, erro: error.message || "Não foi possível concluir a operação." };
  }
}