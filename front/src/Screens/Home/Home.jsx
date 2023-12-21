import React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const Home = () => {

 

  return (
    <>
        <h1>FunWorld</h1>
        <div>
            <Link to="/text">Text Chat</Link>
            <Link to={`/video`}>Video Chat</Link>
        </div>
    </>
  )
}

export default Home