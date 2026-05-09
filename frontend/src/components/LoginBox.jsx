import { useState } from "react";

import axios from "axios";

const LoginBox = () => {

    const [email, setEmail] = useState("");

    const [password, setPassword] =
        useState("");

    const handleLogin = async () => {

        try {

            const response =
                await axios.post(
                    "http://localhost:5000/api/auth/login",

                    {
                        email,
                        password,
                    }
                );

            localStorage.setItem(
                "token",
                response.data.token
            );

            alert("Login Success");

        } catch (error) {

            console.log(error);

            alert("Login Failed");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "30px",
            }}
        >
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
                style={{
                    padding: "12px",
                }}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
                style={{
                    padding: "12px",
                }}
            />

            <button
                onClick={handleLogin}
                style={{
                    padding: "12px",
                    cursor: "pointer",
                }}
            >
                Login
            </button>
        </div>
    );
};

export default LoginBox;