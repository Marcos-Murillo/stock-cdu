// Configuración de Firebase con nuevas funciones
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  increment,
} from "firebase/firestore"
import type { InventoryItem, Loan, DamageReport, BorrowerSuggestion, User } from "./types"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqdvCQrUVFG953lsaHTXvcweTnacixX3s",
  authDomain: "stock-cdu.firebaseapp.com",
  projectId: "stock-cdu",
  storageBucket: "stock-cdu.firebasestorage.app",
  messagingSenderId: "185915862646",
  appId: "1:185915862646:web:ba4c8e4810543849b97957"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Funciones para usuarios
export const createUser = async (user: Omit<User, "id">) => {
  try {
    // Verificar si ya existe un usuario con esa cédula
    const existingUser = await getUserByCedula(user.cedula)
    if (existingUser) {
      throw new Error("Ya existe un usuario registrado con esta cédula")
    }

    const docRef = await addDoc(collection(db, "users"), {
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating user:", error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error("Error desconocido al crear usuario")
  }
}

export const getUserByCedula = async (cedula: string): Promise<User | null> => {
  try {
    const q = query(collection(db, "users"), where("cedula", "==", cedula))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as User
  } catch (error) {
    console.error("Error getting user by cedula:", error)
    return null
  }
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as User[]
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

// Funciones para el inventario
export const addItem = async (item: Omit<InventoryItem, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "inventory"), {
      ...item,
      createdAt: Timestamp.fromDate(item.createdAt),
      loanCount: 0,
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al agregar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al agregar elemento")
  }
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "inventory"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as InventoryItem[]
  } catch (error) {
    console.error("Error getting inventory:", error)
    if (error instanceof Error) {
      throw new Error(`Error al cargar inventario: ${error.message}`)
    }
    throw new Error("Error desconocido al cargar inventario")
  }
}

export const removeItem = async (itemId: string) => {
  try {
    await deleteDoc(doc(db, "inventory", itemId))
  } catch (error) {
    console.error("Error removing item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al eliminar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al eliminar elemento")
  }
}

export const updateItemStatus = async (itemId: string, status: "available" | "loaned" | "removed") => {
  try {
    await updateDoc(doc(db, "inventory", itemId), { status })
  } catch (error) {
    console.error("Error updating item status:", error)
    if (error instanceof Error) {
      throw new Error(`Error al actualizar estado: ${error.message}`)
    }
    throw new Error("Error desconocido al actualizar estado")
  }
}

export const updateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
  try {
    await updateDoc(doc(db, "inventory", itemId), updates)
  } catch (error) {
    console.error("Error updating item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al actualizar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al actualizar elemento")
  }
}

// Funciones para préstamos
export const createLoan = async (loan: Omit<Loan, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "loans"), {
      ...loan,
      loanDate: Timestamp.fromDate(loan.loanDate),
      createdAt: Timestamp.now(),
    })

    // Actualizar el estado del elemento y incrementar contador
    await updateItemStatus(loan.itemId, "loaned")
    await updateDoc(doc(db, "inventory", loan.itemId), {
      loanCount: increment(1),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating loan:", error)
    if (error instanceof Error) {
      throw new Error(`Error al crear préstamo: ${error.message}`)
    }
    throw new Error("Error desconocido al crear préstamo")
  }
}

export const getLoans = async (): Promise<Loan[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "loans"), orderBy("loanDate", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      loanDate: doc.data().loanDate.toDate(),
      returnDate: doc.data().returnDate ? doc.data().returnDate.toDate() : undefined,
    })) as Loan[]
  } catch (error) {
    console.error("Error getting loans:", error)
    if (error instanceof Error) {
      throw new Error(`Error al cargar préstamos: ${error.message}`)
    }
    throw new Error("Error desconocido al cargar préstamos")
  }
}

export const returnLoan = async (loanId: string) => {
  try {
    const loanDoc = doc(db, "loans", loanId)
    const loans = await getLoans()
    const loan = loans.find((l) => l.id === loanId)

    if (!loan) {
      throw new Error("Préstamo no encontrado")
    }

    await updateDoc(loanDoc, {
      status: "returned",
      returnDate: Timestamp.now(),
    })

    await updateItemStatus(loan.itemId, "available")
  } catch (error) {
    console.error("Error returning loan:", error)
    if (error instanceof Error) {
      throw new Error(`Error al procesar devolución: ${error.message}`)
    }
    throw new Error("Error desconocido al procesar devolución")
  }
}

// Funciones para sugerencias de prestatarios
export const getBorrowerSuggestions = async (searchTerm: string): Promise<BorrowerSuggestion[]> => {
  try {
    // Primero buscar en usuarios registrados
    const usersSnapshot = await getDocs(collection(db, "users"))
    const users = usersSnapshot.docs.map((doc) => doc.data()) as User[]
    
    const userSuggestions = users
      .filter(
        (user) =>
          user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.cedula.includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.codigoEstudiantil && user.codigoEstudiantil.includes(searchTerm))
      )
      .map((user) => ({
        name: user.nombre,
        document: user.cedula,
        phone: user.telefono,
        email: user.email,
        code: user.codigoEstudiantil,
        facultad: user.facultad,
        programa: user.programa,
        genero: user.genero,
        etnia: user.etnia,
        sede: user.sede,
        estamento: user.estamento,
      }))

    if (!searchTerm) return userSuggestions.slice(0, 5)
    return userSuggestions.slice(0, 5)
  } catch (error) {
    console.error("Error getting borrower suggestions:", error)
    return []
  }
}

// Funciones para reportes de daños
export const createDamageReport = async (report: Omit<DamageReport, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "damageReports"), {
      ...report,
      reportDate: Timestamp.fromDate(report.reportDate),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating damage report:", error)
    if (error instanceof Error) {
      throw new Error(`Error al crear reporte: ${error.message}`)
    }
    throw new Error("Error desconocido al crear reporte")
  }
}

export const getDamageReports = async (): Promise<DamageReport[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "damageReports"), orderBy("reportDate", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportDate: doc.data().reportDate.toDate(),
    })) as DamageReport[]
  } catch (error) {
    console.error("Error getting damage reports:", error)
    return []
  }
}

// Función para obtener estadísticas detalladas
export const getDetailedStats = async () => {
  try {
    const [inventory, loans, damageReports] = await Promise.all([getInventory(), getLoans(), getDamageReports()])

    // Estadísticas por elemento
    const itemStats = inventory.map((item) => {
      const itemLoans = loans.filter((loan) => loan.itemId === item.id)
      const itemDamages = damageReports.filter((report) => report.itemId === item.id)

      return {
        ...item,
        totalLoans: itemLoans.length,
        activeLoans: itemLoans.filter((loan) => loan.status === "active").length,
        returnedLoans: itemLoans.filter((loan) => loan.status === "returned").length,
        damageReports: itemDamages.length,
        lastLoanDate: itemLoans.length > 0 ? itemLoans[0].loanDate : null,
      }
    })

    // Estadísticas por facultad
    const facultadStats = loans.reduce(
      (acc, loan) => {
        if (loan.facultad) {
          if (!acc[loan.facultad]) {
            acc[loan.facultad] = {
              totalLoans: 0,
              activeLoans: 0,
              returnedLoans: 0,
            }
          }
          acc[loan.facultad].totalLoans++
          if (loan.status === "active") {
            acc[loan.facultad].activeLoans++
          } else {
            acc[loan.facultad].returnedLoans++
          }
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Estadísticas por programa
    const programaStats = loans.reduce(
      (acc, loan) => {
        if (loan.programa) {
          if (!acc[loan.programa]) {
            acc[loan.programa] = {
              totalLoans: 0,
              activeLoans: 0,
              returnedLoans: 0,
            }
          }
          acc[loan.programa].totalLoans++
          if (loan.status === "active") {
            acc[loan.programa].activeLoans++
          } else {
            acc[loan.programa].returnedLoans++
          }
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Estadísticas por género
    const generoStats = loans.reduce(
      (acc, loan) => {
        if (!acc[loan.genero]) {
          acc[loan.genero] = {
            totalLoans: 0,
            activeLoans: 0,
            returnedLoans: 0,
          }
        }
        acc[loan.genero].totalLoans++
        if (loan.status === "active") {
          acc[loan.genero].activeLoans++
        } else {
          acc[loan.genero].returnedLoans++
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      itemStats: itemStats.sort((a, b) => b.totalLoans - a.totalLoans),
      facultadStats,
      programaStats,
      generoStats,
      totalItems: inventory.length,
      totalLoans: loans.length,
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      totalDamageReports: damageReports.length,
    }
  } catch (error) {
    console.error("Error getting detailed stats:", error)
    throw error
  }
}

export const testFirebaseConnection = async () => {
  try {
    const testCollection = collection(db, "test")
    await getDocs(testCollection)
    return true
  } catch (error) {
    console.error("Error de conexión a Firebase:", error)
    return false
  }
}
