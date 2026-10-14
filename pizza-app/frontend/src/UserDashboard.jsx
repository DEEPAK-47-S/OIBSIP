import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDashboard() {
  const [orders, setOrders] = useState([]);
  const [base, setBase] = useState('');
  const [sauce, setSauce] = useState('');
  const [cheese, setCheese] = useState('');
  const [veggies, setVeggies] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const token = localStorage.getItem('token');
  
  const bases = ['Thin Crust', 'Thick Crust', 'Cheese Burst', 'Gluten Free', 'Pan Pizza'];
  const sauces = ['Tomato', 'Pesto', 'BBQ', 'Garlic Parmesan', 'Alfredo'];
  const cheeses = ['Mozzarella', 'Cheddar', 'Parmesan', 'Vegan Cheese'];
  const vegOptions = ['Olives', 'Jalapenos', 'Mushrooms', 'Onions', 'Bell Peppers'];

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVeggie = (veg) => {
    if (veggies.includes(veg)) {
      setVeggies(veggies.filter(v => v !== veg));
    } else {
      setVeggies([...veggies, veg]);
    }
  };

  const proceedToSummary = () => {
    if (!base || !sauce || !cheese) return alert('Please select base, sauce, and cheese');
    setShowSummary(true);
  }

  const handlePayment = async () => {
    try {
      // Create order backend
      const res = await axios.post('http://localhost:5000/api/orders', { base, sauce, cheese, veggies }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const options = {
        key: "rzp_test_YourTestKeyId", // Mock key
        amount: "50000", 
        currency: "INR",
        name: "Pizza Delivery App",
        description: "Test Transaction",
        order_id: res.data.razorpayOrderId, 
        handler: async function (response) {
            await axios.post('http://localhost:5000/api/orders/verify', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            alert('Payment Successful & Order Confirmed!');
            setShowSummary(false);
            setBase(''); setSauce(''); setCheese(''); setVeggies([]);
            fetchOrders();
        },
        prefill: { name: "Test User", email: "test@example.com" },
        theme: { color: "#3399cc" }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert('Error placing order');
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Pizza Builder 🍕</h1>
        <button onClick={logout}>Logout</button>
      </header>
      
      {!showSummary ? (
        <div className="builder">
          <h3>1. Choose Base</h3>
          <select value={base} onChange={e => setBase(e.target.value)}><option value="">Select Base</option>{bases.map(b => <option key={b} value={b}>{b}</option>)}</select>
          
          <h3>2. Choose Sauce</h3>
          <select value={sauce} onChange={e => setSauce(e.target.value)}><option value="">Select Sauce</option>{sauces.map(s => <option key={s} value={s}>{s}</option>)}</select>
          
          <h3>3. Choose Cheese</h3>
          <select value={cheese} onChange={e => setCheese(e.target.value)}><option value="">Select Cheese</option>{cheeses.map(c => <option key={c} value={c}>{c}</option>)}</select>
          
          <h3>4. Choose Veggies</h3>
          <div className="veggies-grid">
            {vegOptions.map(v => (
              <label key={v}>
                <input type="checkbox" checked={veggies.includes(v)} onChange={() => toggleVeggie(v)} /> {v}
              </label>
            ))}
          </div>
          <button className="order-btn" onClick={proceedToSummary}>Review Order Summary</button>
        </div>
      ) : (
        <div className="builder summary-box">
          <h2>Order Summary</h2>
          <ul>
            <li><strong>Base:</strong> {base}</li>
            <li><strong>Sauce:</strong> {sauce}</li>
            <li><strong>Cheese:</strong> {cheese}</li>
            <li><strong>Veggies:</strong> {veggies.length > 0 ? veggies.join(', ') : 'None'}</li>
          </ul>
          <h3>Total Amount: ₹500.00</h3>
          <div style={{display:'flex', gap:'10px', marginTop: '20px'}}>
             <button className="order-btn" style={{background:'#6b7280'}} onClick={() => setShowSummary(false)}>Back</button>
             <button className="order-btn" onClick={handlePayment}>Pay with Razorpay</button>
          </div>
        </div>
      )}

      <div className="orders">
        <h2>My Orders (Real-time tracking)</h2>
        {orders.map(o => (
          <div key={o._id} className="order-card">
            <p><strong>Order ID:</strong> {o._id}</p>
            <p><strong>Pizza:</strong> {o.pizza.base}, {o.pizza.sauce}, {o.pizza.cheese}, {o.pizza.veggies.join(', ')}</p>
            <p><strong>Payment Status:</strong> {o.paymentStatus}</p>
            <p><strong>Tracking Status:</strong> <span className={`status`}>{o.status}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
