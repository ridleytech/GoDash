const { MENU_PRODUCTS } = require("../data/menu");

function getSubtotalCents(cartByProductId) {
  return Object.entries(cartByProductId).reduce((sum, [productId, qty]) => {
    const p = MENU_PRODUCTS.find((x) => x.id === productId);
    if (!p) return sum;
    return sum + p.priceCents * Number(qty || 0);
  }, 0);
}

function computeSummary(group) {
  const participants = [group.hostEmail, ...group.invitedEmails];
  const breakdown = participants.map((email) => {
    const cart = group.cartsByEmail[email] || {};
    return {
      email,
      cart,
      subtotalCents: getSubtotalCents(cart),
    };
  });
  const totalCents = breakdown.reduce((sum, p) => sum + p.subtotalCents, 0);
  return { participants, breakdown, totalCents };
}

module.exports = {
  computeSummary,
};
