import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling for new orders/stock changes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const invRes = await axios.get('http://localhost:5000/api/inventory');
      setInventory(invRes.data);
      
      const ordRes = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(ordRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  
  const updateStock = async (id, stock) => {
      try {
          await axios.put(`http://localhost:5000/api/inventory/${id}`, { stock }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchData();
      } catch (err) {
          console.error(err);
      }
  }

  const seedInventory = async () => {
      await axios.post('http://localhost:5000/api/inventory/seed');
      fetchData();
  }

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="dashboard admin">
      <header>
        <h1>Admin Dashboard 🛡️</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <div className="admin-grid">
        <div className="inventory-panel">
          <h2>Inventory Management</h2>
          {inventory.length === 0 && <button onClick={seedInventory}>Seed Initial Inventory</button>}
          {inventory.map(item => (
            <div key={item._id} className="inv-item">
              <span>{item.itemType.toUpperCase()}: {item.name} (Stock: {item.stock})</span>
              <input type="number" defaultValue={item.stock} onBlur={(e) => updateStock(item._id, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="orders-panel">
          <h2>Order Management</h2>
          {orders.map(o => (
            <div key={o._id} className="order-card">
              <p><strong>Order ID:</strong> {o._id}</p>
              <p><strong>User:</strong> {o.user?.email}</p>
              <p><strong>Pizza:</strong> {o.pizza.base}, {o.pizza.sauce}</p>
              <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                <option value="Order Received">Order Received</option>
                <option value="In Kitchen">In Kitchen</option>
                <option value="Sent to Delivery">Sent to Delivery</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
