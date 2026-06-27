// Push events to GTM dataLayer. GTM then routes to Meta Pixel, GA4, TikTok, etc.
const dl = () => (window.dataLayer = window.dataLayer || []);

export function trackViewContent(bloc, currency = "BDT") {
  dl().push({
    event: "view_item",
    ecommerce: {
      currency,
      value: bloc.blocPrice,
      items: [{ item_id: bloc._id, item_name: bloc.title, price: bloc.blocPrice, quantity: 1 }],
    },
  });
}

export function trackAddToCart(bloc, qty, currency = "BDT") {
  dl().push({
    event: "add_to_cart",
    ecommerce: {
      currency,
      value: bloc.blocPrice * qty,
      items: [{ item_id: bloc._id, item_name: bloc.title, price: bloc.blocPrice, quantity: qty }],
    },
  });
}

export function trackInitiateCheckout(bloc, qty, currency = "BDT") {
  dl().push({
    event: "begin_checkout",
    ecommerce: {
      currency,
      value: bloc.blocPrice * qty,
      items: [{ item_id: bloc._id, item_name: bloc.title, price: bloc.blocPrice, quantity: qty }],
    },
  });
}

export function trackPurchase(order, bloc, currency = "BDT") {
  dl().push({
    event: "purchase",
    ecommerce: {
      transaction_id: order.orderId || order._id,
      currency,
      value: order.amount,
      items: [{
        item_id: bloc._id,
        item_name: bloc.title,
        price: bloc.blocPrice,
        quantity: order.quantity,
      }],
    },
  });
}
