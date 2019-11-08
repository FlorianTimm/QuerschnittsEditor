import { stat } from "fs";

/**
 * Startscript edit.html
 * @author Florian Timm, LGV HH 
 * @version 2019.10.29
 * @copyright MIT
 */

export default class Vektor {
    static add3(v: number[]) {
        let neu = [];
        for (let i of v)
            neu.push(i);
        neu.push(0)
        return neu;
    }

    static len(v: number[]): number {
        let r = 0
        for (var i = 0; i < v.length; i++) {
            r += Math.pow(v[i], 2)
        }
        return Math.sqrt(r)
    }

    static lot(v: number[]): number[] {
        let r = []
        if (v.length != 2) {
            console.log("Nur für 2D Vektoren")
            return null
        }
        return [-v[1], v[0]]
    }

    static diff(v1: number[], v2: number[]) {
        let r = []
        if (v1.length != v2.length) {
            console.log("Ungleiche Länge:\n\tv1: " + v1.length + "\n\tv2: " + v2.length)
            return null
        }
        for (var i = 0; i < v1.length; i++) {
            r.push(v1[i] - v2[i])
        }
        return r
    }

    static sum(v1: number[], v2: number[]): number[] {
        let r = []
        if (v1.length != v2.length) {
            console.log("Ungleiche Länge: " + v1.length + " und " + v2.length)
            return null // Ungleiche Länge
        }
        for (var i = 0; i < v1.length; i++) {
            r.push(v1[i] + v2[i])
        }
        return r
    }

    static skalar(v1: number[], v2: number[]): number {
        let r = 0
        if (v1.length != v2.length) {
            return null // Ungleiche Länge
        }
        for (var i = 0; i < v1.length; i++) {
            r += v1[i] * v2[i]
        }
        return r
    }

    static kreuz(v1: number[], v2: number[]): number[] {
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
            let w = v1[n] * v2[nn] - v1[nn] * v2[n]
            r.push(w)
        }
        return r
    }


    static multi(v: number[], z: number) {
        let r = []
        for (var i = 0; i < v.length; i++) {
            r.push(v[i] * z)
        }
        return r
    }

    static einheit(v: number[]) {
        let len = Vektor.len(v);
        if (len == 0) return v;
        return Vektor.multi(v, 1 / len)
    }

    static line_len(line: number[][]) {
        let len = 0
        //console.log(line)
        for (var i = 1; i < line.length; i++) {
            len += Vektor.len(Vektor.diff(line[i - 1], line[i]))
        }
        return len
    }


    static azi(von: number[], zu: number[]): number {
        let t = Math.atan2(zu[1] - von[1], zu[0] - von[0]);
        if (t < 0) t += 2 * Math.PI;
        return t
    }

    static azi2vec(azi: number): number[] {
        return [Math.cos(azi), Math.sin(azi)]
    }

}