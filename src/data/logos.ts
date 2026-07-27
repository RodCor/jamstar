/**
 * Real logo assets, when you have the rights to them.
 *
 * The game ships with generated crests (see `TeamCrest.tsx`) built from each
 * club's real colours, so it looks like a coherent badge system out of the box
 * and carries no third-party artwork.
 *
 * To use real logos:
 *   1. Drop files into `public/logos/` named after the id they belong to —
 *      `lal.svg`, `el_rma.png`, `leagues/acb.svg`, `cups/copa_rey.png`. Ids
 *      are listed in `teams.ts`, `leagues.ts` and `cups.ts`.
 *   2. Run `npm run logos` to regenerate the maps below from those folders.
 *
 * `npm run logos:fetch` fills those folders from Wikipedia; see
 * `scripts/fetch-logos.mjs`.
 *
 * Anything not listed here falls back to its generated crest, so a partial set
 * works fine — you can add the leagues you have rights to and leave the rest.
 *
 * Club logos are copyrighted artwork as well as trademarks. Shipping them is a
 * separate question from using club names; make sure you have permission before
 * publishing a build that includes them.
 */

/** Team id → path under `public/`. Regenerate with `npm run logos`. */
export const LOGO_OVERRIDES: Record<string, string> = {
  aba_bud: '/logos/aba_bud.svg',
  aba_ceo: '/logos/aba_ceo.png',
  aba_czv: '/logos/aba_czv.svg',
  aba_iga: '/logos/aba_iga.png',
  aba_meg: '/logos/aba_meg.png',
  aba_par: '/logos/aba_par.svg',
  aba_spl: '/logos/aba_spl.jpg',
  aba_zad: '/logos/aba_zad.png',
  acb_bas: '/logos/acb_bas.png',
  acb_bre: '/logos/acb_bre.svg',
  acb_fcb: '/logos/acb_fcb.svg',
  acb_gcn: '/logos/acb_gcn.svg',
  acb_jov: '/logos/acb_jov.png',
  acb_man: '/logos/acb_man.webp',
  acb_mur: '/logos/acb_mur.svg',
  acb_rma: '/logos/acb_rma.png',
  acb_ten: '/logos/acb_ten.png',
  acb_uni: '/logos/acb_uni.png',
  acb_val: '/logos/acb_val.svg',
  acb_zar: '/logos/acb_zar.png',
  atl: '/logos/atl.svg',
  bkn: '/logos/bkn.svg',
  bos: '/logos/bos.svg',
  bsl_bes: '/logos/bsl_bes.svg',
  bsl_efs: '/logos/bsl_efs.svg',
  bsl_fen: '/logos/bsl_fen.svg',
  bsl_gal: '/logos/bsl_gal.png',
  bsl_tof: '/logos/bsl_tof.png',
  cba_bei: '/logos/cba_bei.png',
  cba_gua: '/logos/cba_gua.png',
  cba_lia: '/logos/cba_lia.png',
  cba_sha: '/logos/cba_sha.png',
  cba_xin: '/logos/cba_xin.png',
  cba_zhe: '/logos/cba_zhe.jpg',
  cha: '/logos/cha.svg',
  chi: '/logos/chi.svg',
  cle: '/logos/cle.svg',
  dal: '/logos/dal.svg',
  den: '/logos/den.svg',
  det: '/logos/det.svg',
  el_alb: '/logos/el_alb.svg',
  el_asv: '/logos/el_asv.svg',
  el_bas: '/logos/el_bas.png',
  el_bay: '/logos/el_bay.svg',
  el_czv: '/logos/el_czv.svg',
  el_efs: '/logos/el_efs.svg',
  el_fcb: '/logos/el_fcb.svg',
  el_fen: '/logos/el_fen.svg',
  el_mac: '/logos/el_mac.svg',
  el_mil: '/logos/el_mil.svg',
  el_mon: '/logos/el_mon.svg',
  el_oly: '/logos/el_oly.svg',
  el_pan: '/logos/el_pan.svg',
  el_par: '/logos/el_par.svg',
  el_ptz: '/logos/el_ptz.svg',
  el_rma: '/logos/el_rma.png',
  el_vir: '/logos/el_vir.svg',
  el_zal: '/logos/el_zal.svg',
  fra_asv: '/logos/fra_asv.svg',
  fra_cho: '/logos/fra_cho.png',
  fra_lem: '/logos/fra_lem.png',
  fra_mon: '/logos/fra_mon.svg',
  fra_nan: '/logos/fra_nan.png',
  fra_par: '/logos/fra_par.svg',
  fra_stb: '/logos/fra_stb.png',
  fra_str: '/logos/fra_str.png',
  gbl_ath: '/logos/gbl_ath.png',
  gbl_oly: '/logos/gbl_oly.svg',
  gbl_pan: '/logos/gbl_pan.svg',
  gbl_par: '/logos/gbl_par.png',
  gbl_per: '/logos/gbl_per.png',
  gl_ign: '/logos/gl_ign.svg',
  gl_ral: '/logos/gl_ral.svg',
  gl_scw: '/logos/gl_scw.svg',
  gsw: '/logos/gsw.svg',
  hou: '/logos/hou.svg',
  ind: '/logos/ind.svg',
  lac: '/logos/lac.svg',
  lal: '/logos/lal.svg',
  leb_alm: '/logos/leb_alm.png',
  leb_bur: '/logos/leb_bur.png',
  leb_ovi: '/logos/leb_ovi.png',
  lega_bre: '/logos/lega_bre.png',
  lega_mil: '/logos/lega_mil.svg',
  lega_sas: '/logos/lega_sas.png',
  lega_tor: '/logos/lega_tor.svg',
  lega_tra: '/logos/lega_tra.svg',
  lega_tri: '/logos/lega_tri.png',
  lega_ven: '/logos/lega_ven.png',
  lega_vir: '/logos/lega_vir.svg',
  lkl_lie: '/logos/lkl_lie.svg',
  lkl_nep: '/logos/lkl_nep.png',
  lkl_ryt: '/logos/lkl_ryt.svg',
  lkl_sir: '/logos/lkl_sir.png',
  lkl_zal: '/logos/lkl_zal.svg',
  lnb_ate: '/logos/lnb_ate.png',
  lnb_bbc: '/logos/lnb_bbc.svg',
  lnb_fer: '/logos/lnb_fer.svg',
  lnb_gim: '/logos/lnb_gim.svg',
  lnb_ins: '/logos/lnb_ins.svg',
  lnb_obr: '/logos/lnb_obr.png',
  lnb_ola: '/logos/lnb_ola.png',
  lnb_pen: '/logos/lnb_pen.png',
  lnb_pla: '/logos/lnb_pla.svg',
  lnb_qui: '/logos/lnb_qui.svg',
  lnb_reg: '/logos/lnb_reg.png',
  lnb_sma: '/logos/lnb_sma.svg',
  mem: '/logos/mem.svg',
  mia: '/logos/mia.svg',
  mil: '/logos/mil.svg',
  min: '/logos/min.svg',
  nbb_bau: '/logos/nbb_bau.png',
  nbb_cor: '/logos/nbb_cor.svg',
  nbb_fla: '/logos/nbb_fla.svg',
  nbb_fra: '/logos/nbb_fra.png',
  nbb_min: '/logos/nbb_min.svg',
  nbb_pat: '/logos/nbb_pat.png',
  nbb_pau: '/logos/nbb_pau.svg',
  nbb_sao: '/logos/nbb_sao.svg',
  nbl_bri: '/logos/nbl_bri.png',
  nbl_ill: '/logos/nbl_ill.png',
  nbl_mel: '/logos/nbl_mel.png',
  nbl_nzb: '/logos/nbl_nzb.svg',
  nbl_per: '/logos/nbl_per.png',
  nbl_syd: '/logos/nbl_syd.svg',
  ncaa_ala: '/logos/ncaa_ala.svg',
  ncaa_ariz: '/logos/ncaa_ariz.svg',
  ncaa_bay: '/logos/ncaa_bay.svg',
  ncaa_duk: '/logos/ncaa_duk.svg',
  ncaa_gon: '/logos/ncaa_gon.svg',
  ncaa_hou: '/logos/ncaa_hou.svg',
  ncaa_kan: '/logos/ncaa_kan.svg',
  ncaa_ken: '/logos/ncaa_ken.svg',
  ncaa_mich: '/logos/ncaa_mich.svg',
  ncaa_ucla: '/logos/ncaa_ucla.svg',
  ncaa_uconn: '/logos/ncaa_uconn.svg',
  ncaa_unc: '/logos/ncaa_unc.svg',
  nop: '/logos/nop.svg',
  nyk: '/logos/nyk.svg',
  okc: '/logos/okc.svg',
  orl: '/logos/orl.svg',
  phi: '/logos/phi.svg',
  phx: '/logos/phx.svg',
  por: '/logos/por.svg',
  prob_evr: '/logos/prob_evr.png',
  prob_ort: '/logos/prob_ort.png',
  sac: '/logos/sac.svg',
  sas: '/logos/sas.svg',
  tor: '/logos/tor.svg',
  uta: '/logos/uta.svg',
  was: '/logos/was.svg',
}

export function logoPathFor(teamId: string): string | null {
  return LOGO_OVERRIDES[teamId] ?? null
}

/** League id → path under `public/`. Regenerate with `npm run logos`. */
export const LEAGUE_LOGOS: Record<string, string> = {
  aba: '/logos/leagues/aba.png',
  acb: '/logos/leagues/acb.svg',
  betclic: '/logos/leagues/betclic.png',
  bsl: '/logos/leagues/bsl.png',
  cba: '/logos/leagues/cba.svg',
  euroleague: '/logos/leagues/euroleague.svg',
  g_league: '/logos/leagues/g_league.svg',
  gbl: '/logos/leagues/gbl.jpg',
  leb_oro: '/logos/leagues/leb_oro.svg',
  lega_a: '/logos/leagues/lega_a.png',
  lkl: '/logos/leagues/lkl.svg',
  lnb_ar: '/logos/leagues/lnb_ar.svg',
  nba: '/logos/leagues/nba.svg',
  nbb: '/logos/leagues/nbb.svg',
  nbl: '/logos/leagues/nbl.svg',
  ncaa: '/logos/leagues/ncaa.svg',
  pro_b: '/logos/leagues/pro_b.svg',
}

export function leagueLogoPathFor(leagueId: string): string | null {
  return LEAGUE_LOGOS[leagueId] ?? null
}

/** Cup id → path under `public/`. Regenerate with `npm run logos`. */
export const CUP_LOGOS: Record<string, string> = {
  copa_rey: '/logos/cups/copa_rey.png',
  coppa_italia: '/logos/cups/coppa_italia.svg',
  coupe_france: '/logos/cups/coupe_france.jpg',
  coupe_france_b: '/logos/cups/coupe_france_b.jpg',
  greek_cup: '/logos/cups/greek_cup.jpg',
  kmt: '/logos/cups/kmt.png',
  nba_cup: '/logos/cups/nba_cup.png',
}

export function cupLogoPathFor(cupId: string): string | null {
  return CUP_LOGOS[cupId] ?? null
}
