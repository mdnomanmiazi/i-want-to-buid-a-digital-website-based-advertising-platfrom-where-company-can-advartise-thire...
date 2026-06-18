// Payment gateway client (SSLCommerz-style endpoint)
const DEFAULT_ENDPOINT = "https://pay.ieltsai.net/api.php";

export interface PaymentProduct {
  name: string;
  price: number;
  quantity?: number;
  description?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
}

export const generateTransactionId = (prefix = "AYNA") =>
  `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

export interface PaymentResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
  tranId: string;
}

export const initiatePayment = async (
  products: PaymentProduct[],
  customer: CustomerInfo,
  tranId: string,
  endpoint: string = DEFAULT_ENDPOINT,
): Promise<PaymentResult> => {
  try {
    const subtotal = products.reduce((s, p) => s + p.price * (p.quantity || 1), 0);
    const payload = {
      total_amount: subtotal,
      cus_name: customer.name,
      cus_email: customer.email,
      cus_phone: customer.phone,
      cus_add1: customer.address || "Dhaka",
      cus_city: customer.city || "Dhaka",
      cus_country: "Bangladesh",
      tran_id: tranId,
      order_details: {
        products: products.map((p) => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity || 1,
          description: p.description || "",
        })),
        subtotal,
        total: subtotal,
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const url =
      (data.status === "SUCCESS" && data.GatewayPageURL) ||
      (data.status === "success" && data.data) ||
      data.GatewayPageURL;
    if (url) return { success: true, redirectUrl: url, tranId };
    return {
      success: false,
      error: data.failedreason || data.message || "Unknown payment error",
      tranId,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to reach payment gateway",
      tranId,
    };
  }
};
