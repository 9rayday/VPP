function fmt(n)  { return Math.round(n).toLocaleString('ko-KR'); }
function fmtM(n) { return (n / 1000000).toFixed(1); }

var DASH_IDS = [
  'sDailyGen','sDailyBid','sDailyRT','sEffCap',
  'cA_total','cA_annual','cA_da','cA_rt','cA_cp','cA_rec','cA_vpp',
  'cB_total','cB_annual','cB_da','cB_exp','cB_cp','cB_rec','cB_vpp',
  'cC_total','cC_annual','cC_da','cC_rt','cC_cp','cC_rec','cC_pen','cC_vpp',
  'cD_total','cD_annual','cD_ppa','cD_fee','cD_net','cD_diff',
  'aA','aB','aC','aD','aDiff'
];

function resetOutputs() {
  DASH_IDS.forEach(function(id) { document.getElementById(id).textContent = '—'; });
  document.getElementById('twentyGrid').innerHTML = '';
  window._annMap = null;
}

function calc() {
  var capRaw = document.getElementById('iCAP').value;
  var genRaw = document.getElementById('iGEN').value;
  var bidRaw = document.getElementById('iBID').value;

  if (capRaw === '' || genRaw === '' || bidRaw === '') {
    resetOutputs();
    return;
  }

  var CAP = +capRaw;
  var GEN = +genRaw;
  var BID = +bidRaw;

  if (!CAP || !GEN || !BID) {
    resetOutputs();
    return;
  }
  var penPct = +document.getElementById('iPEN').value;
  document.getElementById('vPEN').textContent = penPct.toFixed(1) + '%';

  var DA      = +document.getElementById('sDA').value;
  var RT      = +document.getElementById('sRT').value;
  var REC     = +document.getElementById('sREC').value;
  var CP      = +document.getElementById('sCP').value;
  var PPA     = +document.getElementById('sPPA').value;
  var CUT     = +document.getElementById('sCUT').value / 100;
  var EFF     = +document.getElementById('sEFF').value / 100;
  var VPP_FEE = +document.getElementById('sVPP').value / 100;

  document.getElementById('vVPP').textContent = (+document.getElementById('sVPP').value).toFixed(1) + '%';
  document.getElementById('vDA').textContent  = DA + '원';
  document.getElementById('vRT').textContent  = RT + '원';
  document.getElementById('vREC').textContent = REC + '원';
  document.getElementById('vCP').textContent  = (+CP).toFixed(1) + '원';
  document.getElementById('vPPA').textContent = PPA + '원';
  document.getElementById('vCUT').textContent = Math.round(CUT * 100) + '%';
  document.getElementById('vEFF').textContent = (+document.getElementById('sEFF').value).toFixed(1) + '%';

  var genKWh = GEN * CAP;
  var bidKWh = BID * CAP;
  var rtKWh  = (GEN - BID) * CAP;
  var effCap = CAP * EFF;
  var PEN    = genKWh * penPct / 100;

  document.getElementById('sDailyGen').textContent = fmt(genKWh);
  document.getElementById('sDailyBid').textContent = fmt(bidKWh);
  document.getElementById('sDailyRT').textContent  = (rtKWh >= 0 ? '+' : '') + fmt(rtKWh);
  document.getElementById('sEffCap').textContent   = Math.round(effCap);

  var daInc  = bidKWh * DA;
  var rtInc  = rtKWh  * RT;
  var recInc = genKWh * REC;
  var cpInc  = effCap * CP * GEN;

  // CASE A
  var aGross  = daInc + rtInc + cpInc + recInc;
  var vppCost = aGross * VPP_FEE;
  var A       = aGross - vppCost;
  document.getElementById('cA_total').textContent  = fmt(A);
  document.getElementById('cA_annual').textContent = fmtM(A * 365) + ' 백만원';
  document.getElementById('cA_vpp').textContent    = '-' + fmt(vppCost) + '원';
  document.getElementById('cA_da').textContent     = fmt(daInc) + '원';
  document.getElementById('cA_rt').textContent     = fmt(rtInc) + '원';
  document.getElementById('cA_cp').textContent     = fmt(cpInc) + '원';
  document.getElementById('cA_rec').textContent    = fmt(recInc) + '원';

  // CASE B
  var bDa    = daInc  * (1 - CUT);
  var bExp   = daInc  * CUT * 0.85;
  var bRec   = recInc * (1 - CUT);
  var bGross = bDa + bExp + cpInc + bRec;
  var vppCostB = bGross * VPP_FEE;
  var B = bGross - vppCostB;
  document.getElementById('cB_total').textContent  = fmt(B);
  document.getElementById('cB_annual').textContent = fmtM(B * 365) + ' 백만원';
  document.getElementById('cB_vpp').textContent    = '-' + fmt(vppCostB) + '원';
  document.getElementById('cB_da').textContent     = fmt(bDa) + '원';
  document.getElementById('cB_exp').textContent    = fmt(bExp) + '원';
  document.getElementById('cB_cp').textContent     = fmt(cpInc) + '원';
  document.getElementById('cB_rec').textContent    = fmt(bRec) + '원';

  // CASE C
  var penalty  = PEN * RT * 0.20;
  var cGross   = daInc + rtInc + cpInc + recInc - penalty;
  var vppCostC = cGross * VPP_FEE;
  var C = cGross - vppCostC;
  document.getElementById('cC_total').textContent  = fmt(C);
  document.getElementById('cC_annual').textContent = fmtM(C * 365) + ' 백만원';
  document.getElementById('cC_vpp').textContent    = '-' + fmt(vppCostC) + '원';
  document.getElementById('cC_da').textContent     = fmt(daInc) + '원';
  document.getElementById('cC_rt').textContent     = fmt(rtInc) + '원';
  document.getElementById('cC_cp').textContent     = fmt(cpInc) + '원';
  document.getElementById('cC_rec').textContent    = fmt(recInc) + '원';
  document.getElementById('cC_pen').textContent    = '-' + fmt(penalty) + '원';

  var annA = A * 365;
  var annB = B * 365;
  var annC = C * 365;
  document.getElementById('aA').textContent = fmtM(annA);
  document.getElementById('aB').textContent = fmtM(annB);
  document.getElementById('aC').textContent = fmtM(annC);

  // CASE D
  var ppaUsage = genKWh * PPA;
  var ppaFee   = genKWh * 0.1193;
  var D        = ppaUsage - ppaFee;
  var diffDA   = D - A;

  document.getElementById('cD_total').textContent  = fmt(D);
  document.getElementById('cD_annual').textContent = fmtM(D * 365) + ' 백만원';
  document.getElementById('cD_ppa').textContent    = fmt(ppaUsage) + '원';
  document.getElementById('cD_fee').textContent    = '-' + fmt(ppaFee) + '원';
  document.getElementById('cD_net').textContent    = fmt(D) + '원';
  document.getElementById('cD_diff').textContent   = (diffDA >= 0 ? '+' : '') + fmt(diffDA) + '원';

  var annD = D * 365;
  document.getElementById('aD').textContent    = fmtM(annD);
  document.getElementById('aDiff').textContent = (diffDA >= 0 ? '+' : '') + fmtM(diffDA * 365);

  window._annMap = { A: annA, B: annB, C: annC, D: annD };
  renderTwenty();
}

function renderTwenty() {
  var sel = document.getElementById('twentyCase');
  if (!sel || !window._annMap) return;
  var key  = sel.value;
  var base = window._annMap[key] || 0;
  var html = '';
  var cum  = 0;
  for (var y = 1; y <= 20; y++) {
    var eff     = Math.pow(1 - 0.005, y - 1);
    var yearRev = base * eff;
    cum += yearRev;
    html += '<div class="twenty-card">'
      + '<div class="twenty-year">' + y + '년</div>'
      + '<div class="twenty-val">' + fmtM(yearRev) + '</div>'
      + '<div class="twenty-cum">누적 ' + fmtM(cum) + '</div>'
      + '</div>';
  }
  document.getElementById('twentyGrid').innerHTML = html;
}

calc();
