class Vektor {

    /**
     * Berechnet eine Station
     * @param {Array<Array<number>>} line Linie des Abschnittes auf dem stationiert werden soll
     * @param {Array<number>} point Punkt, der stationiert werden soll
     */
    static get_pos(line, point) {
        let posi = []
        let sum = 0
    
        for (var i = 0; i < line.length - 1; i++) {
            let l1 = line[i]
            let l2 = line[i+1]
            let v = Vektor.diff(l2, l1)
            let f = (Vektor.skalar(Vektor.diff(point, l1), v))/(Vektor.skalar(v, v))
            let y = Vektor.sum(l1, Vektor.multi(v, f))
    
            let lot = Vektor.diff(point, y)
            let dist = Vektor.len(lot)
    
            let seite = 'M'
            if (dist > 0.01) {
                let c3 = Vektor.kreuz(Vektor.add3(v), Vektor.add3(lot))[2]
                if (c3 < 0) {
                    seite = 'R'
                } else if (c3 > 0) {
                    seite = 'L'
                }
            }
    
            let r_dist = dist
            let drin = 0
            if (f < 0) {
                f = 0
                r_dist = Vektor.len(Vektor.diff(l1, point))
                drin = 1
                y = line[0];
            } else if (f > 1) {
                f = 1
                r_dist = Vektor.len(Vektor.diff(l2, y))
                drin = 1
                y = line[line.length-1];
            }
            let station = sum + f * (Vektor.len(v))
    
            posi.push([drin, r_dist, station, seite, dist, y, Vektor.sum(y, [lot[0],lot[1]])])
    
            sum += Vektor.len(v)
        }
        //console.log(posi.sort(sort_posi))
        return posi.sort(Vektor.sort_posi)[0]
    }
    
    static sort_posi(a, b) {
        if (a[0] != b[0]) {
            return (a[0] < b[0]) ? -1 : 1;
        }
        if (a[1] != b[1]) {
            return (a[1] < b[1]) ? -1 : 1;
        }
        if (a[2] != b[2]) {
            return (a[2] < b[2]) ? -1 : 1;
        }
        return 0;
    }
    
    static add3(v) {
        let r = v
        r.push(0)
        return r
    }
    
    static len(v) {
        let r = 0
        for (var i = 0; i < v.length; i++) {
            r += Math.pow(v[i], 2)
        }
        return Math.sqrt(r)
    }
    
    static lot(v) {
        let r = []
        if (v.length != 2) {
            console.log("Nur für 2D Vektoren")
            return null
        }
        return [-v[1], v[0]]
    }
    
    static diff(v1, v2) {
        let r = []
        if (v1.length != v2.length) {
            console.log("Ungleiche Länge")
            return null
        }
        for (var i = 0; i < v1.length; i++) {
            r.push(v1[i] - v2[i])
        }
        return r
    }
    
    static sum(v1, v2) {
        let r = []
        if (v1.length != v2.length) {
            return null // Ungleiche Länge
        }
        for (var i = 0; i < v1.length; i++) {
            r.push(v1[i] + v2[i])
        }
        return r
    }
    
    static skalar(v1, v2) {
        let r = 0
        if (v1.length != v2.length) {
            return null // Ungleiche Länge
        }
        for (var i = 0; i < v1.length; i++) {
            r += v1[i] * v2[i]
        }
        return r
    }
    
    static kreuz(v1, v2) {
        let r = []
        for (var i = 0; i < v1.length; i++) {
            let n = i + 1
            let nn = i + 2
            if (n >= v1.length) {
                n -= v1.length
            }
            if (nn >= v1.length) {
                nn -= v1.length
            }
            let w = v1[n]*v2[nn] - v1[nn]*v2[n]
            r.push(w)
        }
        return r
    }
    
    
    static multi(v, z) {
        let r = []
        for (var i = 0; i < v.length; i++) {
            r.push(v[i] * z)
        }
        return r
    }
    
    static einheit(v) {
        let len = Vektor.len(v);
        if (len == 0) return v;
        return Vektor.multi(v, 1/len)
    }
    
    static line_len(line) {
        let len = 0
        //console.log(line)
        for (var i = 1; i < line.length; i++) {
            len += Vektor.len(Vektor.diff(line[i-1],line[i]))
        }
        return len
    }
    
    
    static azi (von, zu) {
        let t = Math.atan2(zu[1]-von[1], zu[0]-von[0]);
        if (t < 0) t += 2 * Math.PI;
        return t
    }
        
    static azi2vec  (azi) {
        return [Math.cos(azi), Math.sin(azi)]
    }

}

export default Vektor;