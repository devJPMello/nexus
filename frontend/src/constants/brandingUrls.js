/** SVGs servidos de /public/branding — sempre copiados para a raiz do dist no deploy. */
const file = (name) => `${import.meta.env.BASE_URL}branding/${name}`;

export const BRANDING = {
  logoWhite: file('logo-branca.svg'),
  historia: file('historia.svg'),
  comunidade: file('comunidade.svg'),
  mapeamento: file('mapeamento-da-mente.svg'),
  contrato: file('contrato.svg'),
  escreva: file('escreva.svg'),
  arrowLeft: file('arrow-left.svg'),
  arrowRight: file('arrow-right.svg'),
  pencil: file('pencil-svgrepo-com.svg'),
};
