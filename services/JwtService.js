import jwt from 'jsonwebtoken';
import { JWT_SECRET, DEBUG_MODE } from '../config';

class JwtService {
    static sign(payload, expiry = (DEBUG_MODE? '240h' : '60s'),secret = JWT_SECRET) { // 240h for convenience during development changes back to 60s for production
        
        return jwt.sign(payload, secret, {expiresIn: expiry});

    }
    
    static verify(token, secret = JWT_SECRET) {
        return jwt.verify(token, secret);
    }
}

export default JwtService;