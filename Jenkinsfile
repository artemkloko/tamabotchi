pipeline {
    agent any
 
    stages {
        stage('npm install') {
            steps {
                nodejs(nodeJSInstallationName: 'node') {
                    sh 'npm i'
                }
            }
        }
        stage('docker build') {
            steps {
                script {
                    docker.build("artemkloko/tamabotchi")
                }
            }
        }
    }
}
